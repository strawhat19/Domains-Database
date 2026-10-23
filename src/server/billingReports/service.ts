import type Stripe from 'stripe';
import { BillingError, type BillingActor } from '../billing/types';
import { getBillingDatabase } from '../billing/firebase';
import { getAppCollectionIDNumber } from '../../shared/common/ids';
import { getBillingStripe, getStarterPriceId } from '../billing/config';
import { createPaymentRange, createPaymentTrend, selectPaymentRange } from './range';
import type { PaymentReport, PaymentCoverage, PaymentReportDays, PaymentSubscriptionStatus } from '../../shared/payments/types';

const cacheMilliseconds = 45_000;
const maximumAccounts = 100;
const maximumRequests = 36;
const maximumRecords = 1000;
const maximumPages = 3;
const reportMilliseconds = 18_000;
const statuses: PaymentSubscriptionStatus[] = [`active`, `paused`, `unpaid`, `trialing`, `past_due`, `canceled`, `incomplete`, `incomplete_expired`];
const isSubscriptionStatus = (value: string): value is PaymentSubscriptionStatus => statuses.some(status => status === value);
type AccountBinding = { id: string; userId: string; customerId: string };
type Progress = { failed: number; scanned: number; completed: number };
type Budget = { calls: number; deadline: number; invoices: Progress; subscriptions: Progress };
let cached: { priceId: string; expiresAt: number; report: PaymentReport } | undefined;
let pending: { priceId: string; report: Promise<PaymentReport> } | undefined;

class ReportLimitError extends Error {}
const identifier = (value: string | { id?: string } | null | undefined) => typeof value === `string` ? value : value?.id ?? ``;
const timestamp = (value: unknown): value is number => typeof value === `number` && Number.isSafeInteger(value) && value > 0;
const warning = (report: PaymentReport, message: string) => { if (!report.warnings.includes(message)) report.warnings.push(message); };
const coverage = (progress: Progress): PaymentCoverage => ({ limit: maximumRecords, scanned: progress.scanned, state: !progress.failed ? `complete` : progress.completed || progress.scanned ? `partial` : `unavailable` });
const bounded = async <T>(operation: Promise<T>, milliseconds: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([operation, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new ReportLimitError()), Math.max(1, milliseconds)); })]); }
  finally { if (timer) clearTimeout(timer); }
};
const requestPage = async <T>(budget: Budget, operation: (options: Stripe.RequestOptions) => Promise<Stripe.ApiList<T>>) => {
  const remaining = budget.deadline - Date.now();
  if (remaining <= 0 || budget.calls >= maximumRequests) throw new ReportLimitError();
  budget.calls += 1;
  const timeout = Math.min(4000, remaining);
  return bounded(operation({ timeout, maxNetworkRetries: 0 }), timeout + 25);
};
const providerWarning = (failure: unknown, source: `Subscription` | `Invoice`) => {
  if (failure instanceof ReportLimitError) return `${source} Reporting Reached Its Time Or Scan Budget — Totals Are Unavailable`;
  const status = (failure as { statusCode?: number })?.statusCode;
  if (status === 401 || status === 403) return `Stripe ${source} Read Access Is Unavailable — Check The Existing Restricted Key Permissions`;
  if (status === 429) return `Stripe ${source} Reporting Is Rate Limited — Try Again Shortly`;
  return `Stripe ${source} Reporting Is Unavailable — Try Again Shortly`;
};
const emptyReport = (now: number): PaymentReport => ({
  mode: `live`,
  source: `stripe`,
  currency: `usd`,
  warnings: [],
  unitAmountCents: 133,
  availability: `available`,
  dataset: `starter_subscriptions`,
  fetchedAt: new Date(now).toISOString(),
  range: createPaymentRange(90, now),
  trend: createPaymentTrend(now),
  subscriptionSnapshotAt: new Date(now).toISOString(),
  cache: { ageSeconds: 0, ttlSeconds: cacheMilliseconds / 1000 },
  statuses: statuses.map(status => ({ status, count: 0 })),
  summary: { paidInvoiceCount: 0, newSubscriptions: 0, endedSubscriptions: 0, activeSubscriptions: 0, pastDueSubscriptions: 0, trialingSubscriptions: 0, scheduledCancellations: 0, monthlyPlanValueCents: 0, paidInvoiceAmountCents: 0 },
  coverage: {
    accounts: { state: `complete`, scanned: 0, limit: maximumAccounts },
    invoices: { state: `complete`, scanned: 0, limit: maximumRecords },
    lifecycle: { state: `complete`, scanned: 0, limit: maximumRecords },
    subscriptions: { state: `complete`, scanned: 0, limit: maximumRecords },
  },
  definitions: {
    monthlyPlanValue: `Active Subscription Count × USD $1.33 List Price, Before Discounts And Tax; Excludes Trials And Is Not MRR`,
    subscriptionSnapshot: `Current Stripe Statuses Across The App's Bound Starter Subscriptions, Independent Of The Selected Date Range; Active Does Not Prove Payment Or Entitlement`,
    paidInvoiceAmount: `Stripe amount_paid For Matching USD Invoices By paid_at; May Include Credits Or Out-Of-Band Settlement, Includes Invoice Tax When Paid, Does Not Deduct Refunds, And Is Not Cash Received Or Net Revenue`,
  },
});
const readAccounts = async (report: PaymentReport, budget: Budget): Promise<AccountBinding[]> => {
  const database = getBillingDatabase();
  const snapshot = await bounded(database.collection(`billingAccounts`).select(`id`, `number`, `userId`, `firebase_uid`, `stripe_customer_id`).limit(maximumAccounts + 1).get(), Math.min(3500, budget.deadline - Date.now()));
  report.coverage.accounts.scanned = Math.min(snapshot.size, maximumAccounts);
  if (snapshot.size > maximumAccounts) {
    report.coverage.accounts.state = `partial`;
    warning(report, `The Billing Account Scan Limit Was Reached — App Totals Are Unavailable`);
    return [];
  }
  const accounts: AccountBinding[] = [];
  const customers = new Set<string>();
  const users = new Set<string>();
  for (const document of snapshot.docs) {
    const record = document.data();
    const valid = record.id === document.id && Number.isSafeInteger(record.number) && record.number > 0 && getAppCollectionIDNumber(record.id, `BillingAccount`) === record.number
      && typeof record.userId === `string` && !!getAppCollectionIDNumber(record.userId, `User`)
      && typeof record.firebase_uid === `string` && record.firebase_uid.length > 0 && record.firebase_uid.length <= 128;
    if (!valid || users.has(record.userId) || (record.stripe_customer_id !== undefined && (typeof record.stripe_customer_id !== `string` || !/^cus_[A-Za-z0-9]{1,200}$/.test(record.stripe_customer_id) || customers.has(record.stripe_customer_id)))) {
      report.coverage.accounts.state = `partial`;
      warning(report, `Saved Billing Account Bindings Could Not Be Fully Confirmed — App Totals Are Unavailable`);
      return [];
    }
    users.add(record.userId);
    if (record.stripe_customer_id) { customers.add(record.stripe_customer_id); accounts.push({ id: record.id, userId: record.userId, customerId: record.stripe_customer_id }); }
  }
  for (let start = 0; start < accounts.length; start += 25) {
    if (Date.now() >= budget.deadline) throw new ReportLimitError();
    const group = accounts.slice(start, start + 25);
    const references = group.flatMap(account => [database.doc(`billingCustomers/${account.customerId}`), database.doc(`billingUsers/${account.userId}`)]);
    const mappings = await bounded(database.getAll(...references, { fieldMask: [`billingAccountId`] }), Math.min(3500, budget.deadline - Date.now()));
    if (group.some((account, index) => mappings[index * 2]?.data()?.billingAccountId !== account.id || mappings[index * 2 + 1]?.data()?.billingAccountId !== account.id)) {
      report.coverage.accounts.state = `partial`;
      warning(report, `Saved Billing Customer Bindings Could Not Be Confirmed — App Totals Are Unavailable`);
      return [];
    }
  }
  return accounts;
};
const matchesBinding = (subscription: Stripe.Subscription, account: AccountBinding) => subscription.livemode
  && identifier(subscription.customer) === account.customerId && subscription.metadata?.plan_slug === `starter`
  && subscription.metadata?.billing_account_id === account.id && subscription.metadata?.app_user_id === account.userId;
const matchesPrice = (subscription: Stripe.Subscription, priceId: string) => {
  const item = subscription.items?.data?.[0];
  return !subscription.items?.has_more && subscription.items?.data?.length === 1 && item?.quantity === 1 && item.price?.id === priceId
    && item.price.currency === `usd` && item.price.unit_amount === 133 && item.price.recurring?.interval === `month` && item.price.recurring.interval_count === 1;
};
const recordSubscription = (report: PaymentReport, subscription: Stripe.Subscription, now: number) => {
  if (!isSubscriptionStatus(subscription.status)) return false;
  report.statuses.find(row => row.status === subscription.status)!.count! += 1;
  if (subscription.status === `active`) report.summary.activeSubscriptions! += 1;
  if (subscription.status === `trialing`) report.summary.trialingSubscriptions! += 1;
  if (subscription.status === `past_due`) report.summary.pastDueSubscriptions! += 1;
  if (![`canceled`, `incomplete_expired`].includes(subscription.status) && (subscription.cancel_at_period_end || (timestamp(subscription.cancel_at) && subscription.cancel_at * 1000 > now))) report.summary.scheduledCancellations! += 1;
  let lifecycle = timestamp(subscription.created);
  if (lifecycle && subscription.created * 1000 <= now) {
    const point = report.trend.find(point => point.date === new Date(subscription.created * 1000).toISOString().slice(0, 10));
    if (point) point.newSubscriptions! += 1;
  }
  if ([`canceled`, `incomplete_expired`].includes(subscription.status)) {
    if (!timestamp(subscription.ended_at) || !lifecycle || subscription.ended_at < subscription.created) lifecycle = false;
    else if (subscription.ended_at * 1000 <= now) {
      const point = report.trend.find(point => point.date === new Date(subscription.ended_at! * 1000).toISOString().slice(0, 10));
      if (point) point.endedSubscriptions! += 1;
    }
  }
  return lifecycle;
};
const scanSubscriptions = async (stripe: Stripe, report: PaymentReport, budget: Budget, account: AccountBinding, priceId: string, now: number) => {
  const admitted = new Set<string>();
  let after: string | undefined;
  let complete = true;
  try {
    for (let page = 0; page < maximumPages; page += 1) {
      if (budget.subscriptions.scanned >= maximumRecords) throw new ReportLimitError();
      const result = await requestPage(budget, options => stripe.subscriptions.list({ limit: 100, status: `all`, price: priceId, customer: account.customerId, ...(after ? { starting_after: after } : {}) }, options));
      for (const subscription of result.data) {
        if (budget.subscriptions.scanned >= maximumRecords) throw new ReportLimitError();
        budget.subscriptions.scanned += 1;
        if (!matchesBinding(subscription, account)) continue;
        if (!matchesPrice(subscription, priceId) || admitted.has(subscription.id) || !isSubscriptionStatus(subscription.status)) {
          complete = false;
          warning(report, `Some Bound Subscriptions Had Unsupported Or Repeated Data — Subscription Totals Are Unavailable`);
          continue;
        }
        admitted.add(subscription.id);
        if (!recordSubscription(report, subscription, now)) {
          report.coverage.lifecycle.state = `partial`;
          warning(report, `Some Subscription Lifecycle Dates Were Unavailable — Period Starts And Ends Are Unavailable`);
        }
      }
      if (!result.has_more) { if (complete) budget.subscriptions.completed += 1; else budget.subscriptions.failed += 1; return { admitted, complete }; }
      after = result.data?.at(-1)?.id;
      if (!after) throw new ReportLimitError();
    }
    throw new ReportLimitError();
  } catch (failure) {
    budget.subscriptions.failed += 1;
    warning(report, providerWarning(failure, `Subscription`));
    return { admitted, complete: false };
  }
};
const recordInvoice = (report: PaymentReport, invoice: Stripe.Invoice, account: AccountBinding, subscriptions: Set<string>, priceId: string, now: number) => {
  const subscriptionId = identifier(invoice.parent?.subscription_details?.subscription);
  if (!invoice.livemode || invoice.status !== `paid` || !subscriptions.has(subscriptionId)) return true;
  if (identifier(invoice.customer) !== account.customerId) return false;
  const paidAt = invoice.status_transitions?.paid_at;
  if (!timestamp(paidAt)) return false;
  if (paidAt * 1000 > now) return true;
  const point = report.trend.find(point => point.date === new Date(paidAt * 1000).toISOString().slice(0, 10));
  if (!point) return true;
  if (invoice.lines?.has_more || !invoice.lines?.data?.length) return false;
  if (!invoice.lines.data.some(line => identifier(line.pricing?.price_details?.price) === priceId)) return true;
  if (invoice.currency !== `usd` || !Number.isSafeInteger(invoice.amount_paid) || invoice.amount_paid < 0
    || !invoice.lines.data.every(line => line.currency === `usd` && identifier(line.pricing?.price_details?.price) === priceId && identifier(line.parent?.subscription_item_details?.subscription) === subscriptionId)
    || !Number.isSafeInteger(point.paidInvoiceAmountCents! + invoice.amount_paid) || !Number.isSafeInteger(report.summary.paidInvoiceAmountCents! + invoice.amount_paid)) return false;
  point.paidInvoices! += 1;
  point.paidInvoiceAmountCents! += invoice.amount_paid;
  report.summary.paidInvoiceAmountCents! += invoice.amount_paid;
  return true;
};
const scanInvoices = async (stripe: Stripe, report: PaymentReport, budget: Budget, account: AccountBinding, subscriptions: Set<string>, priceId: string, now: number) => {
  const seen = new Set<string>();
  let after: string | undefined;
  let complete = true;
  try {
    for (let page = 0; page < maximumPages; page += 1) {
      if (budget.invoices.scanned >= maximumRecords) throw new ReportLimitError();
      const result = await requestPage(budget, options => stripe.invoices.list({ limit: 100, status: `paid`, customer: account.customerId, ...(after ? { starting_after: after } : {}) }, options));
      for (const invoice of result.data) {
        if (budget.invoices.scanned >= maximumRecords) throw new ReportLimitError();
        budget.invoices.scanned += 1;
        if (seen.has(invoice.id) || !recordInvoice(report, invoice, account, subscriptions, priceId, now)) {
          complete = false;
          warning(report, `Some Paid Invoices Had Missing Dates, Mixed Prices, Non-USD Amounts Or Incomplete Lines — Paid Totals Are Unavailable`);
        }
        seen.add(invoice.id);
      }
      if (!result.has_more) { if (complete) budget.invoices.completed += 1; else budget.invoices.failed += 1; return; }
      after = result.data?.at(-1)?.id;
      if (!after) throw new ReportLimitError();
    }
    throw new ReportLimitError();
  } catch (failure) { budget.invoices.failed += 1; warning(report, providerWarning(failure, `Invoice`)); }
};
const finishReport = (report: PaymentReport, budget: Budget) => {
  report.coverage.invoices = coverage(budget.invoices);
  report.coverage.subscriptions = coverage(budget.subscriptions);
  report.coverage.lifecycle = { ...report.coverage.subscriptions, state: report.coverage.subscriptions.state === `complete` ? report.coverage.lifecycle.state : report.coverage.subscriptions.state };
  const accountsComplete = report.coverage.accounts.state === `complete`;
  const subscriptionsComplete = accountsComplete && report.coverage.subscriptions.state === `complete`;
  const invoicesComplete = subscriptionsComplete && report.coverage.invoices.state === `complete`;
  const lifecycleComplete = subscriptionsComplete && report.coverage.lifecycle.state === `complete`;
  if (!accountsComplete) for (const key of [`invoices`, `subscriptions`, `lifecycle`] as const) report.coverage[key].state = `unavailable`;
  if (!subscriptionsComplete) {
    for (const row of report.statuses) row.count = null;
    for (const key of [`activeSubscriptions`, `pastDueSubscriptions`, `trialingSubscriptions`, `scheduledCancellations`, `monthlyPlanValueCents`] as const) report.summary[key] = null;
  } else report.summary.monthlyPlanValueCents = report.summary.activeSubscriptions! * 133;
  for (const point of report.trend) {
    if (!invoicesComplete) { point.paidInvoices = null; point.paidInvoiceAmountCents = null; }
    if (!lifecycleComplete) { point.newSubscriptions = null; point.endedSubscriptions = null; }
  }
  const states = Object.values(report.coverage).map(value => value.state);
  report.availability = states.every(state => state === `complete`) ? `available` : states.every(state => state === `unavailable`) ? `unavailable` : `partial`;
  report.fetchedAt = new Date().toISOString();
  report.subscriptionSnapshotAt = report.fetchedAt;
  return selectPaymentRange(report, 90);
};
const buildReport = async (priceId: string) => {
  const now = Date.now();
  const stripe = getBillingStripe();
  const report = emptyReport(now);
  const budget: Budget = { calls: 0, deadline: now + reportMilliseconds, invoices: { failed: 0, scanned: 0, completed: 0 }, subscriptions: { failed: 0, scanned: 0, completed: 0 } };
  let accounts: AccountBinding[];
  try { accounts = await readAccounts(report, budget); }
  catch (failure) {
    if (failure instanceof BillingError) throw failure;
    report.coverage.accounts.state = `unavailable`;
    warning(report, `Private App Billing Bindings Are Unavailable — Payment Totals Could Not Be Confirmed`);
    return finishReport(report, budget);
  }
  if (report.coverage.accounts.state !== `complete`) return finishReport(report, budget);
  if (!accounts.length) warning(report, `No Linked Billing Subscriptions — No Stripe API Requests Were Needed, So Provider Read Access Has Not Been Verified`);
  let cursor = 0;
  const worker = async () => {
    while (cursor < accounts.length) {
      const account = accounts[cursor++];
      const result = await scanSubscriptions(stripe, report, budget, account, priceId, now);
      if (!result.complete) { budget.invoices.failed += 1; warning(report, `Paid Invoice Coverage Depends On A Complete App Subscription Scan`); continue; }
      if (result.admitted.size) await scanInvoices(stripe, report, budget, account, result.admitted, priceId, now);
      else budget.invoices.completed += 1;
    }
  };
  await Promise.all(Array.from({ length: Math.min(3, accounts.length) }, worker));
  return finishReport(report, budget);
};
export const getPaymentReport = async (actor: BillingActor, days: PaymentReportDays): Promise<PaymentReport> => {
  if (actor.active !== true || actor.owner !== true || actor.role !== `Owner`) throw new BillingError(403, `payments_forbidden`, `Active Owner Access Is Required To View Payments`);
  if (![7, 30, 90].includes(days)) throw new BillingError(400, `payments_range_invalid`, `Choose A Supported Payment Report Range`);
  const priceId = getStarterPriceId();
  getBillingStripe();
  if (cached?.priceId === priceId && cached.expiresAt > Date.now() && cached.report.range.end.slice(0, 10) === new Date().toISOString().slice(0, 10)) return selectPaymentRange(cached.report, days);
  if (pending && pending.priceId !== priceId) throw new BillingError(503, `payments_busy`, `Payment Reporting Is Refreshing — Try Again Shortly`);
  if (!pending) {
    const report = buildReport(priceId).then(report => { cached = { priceId, report, expiresAt: Date.now() + cacheMilliseconds }; return report; });
    pending = { priceId, report };
    void report.finally(() => { if (pending?.report === report) pending = undefined; }).catch(() => undefined);
  }
  return selectPaymentRange(await pending.report, days);
};
