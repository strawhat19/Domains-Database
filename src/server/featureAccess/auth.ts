import { RegistrarRelayError } from '../registrars/errors';
import type { PlanTier } from '../../shared/plans/types';
import { hasStarterPlanAccess } from '../../shared/accountPlans';
import { firebaseEnabled } from '../../shared/firebase/config';
import { getAppCollectionIDNumber } from '../../shared/common/ids';
import { decodeField, readDocument, verifyFirebaseToken, requireSignedInUser, type ImportFirebaseContext } from '../connections/firebase';

export class FeatureAccessError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

const readTier = async (slug: string, context: ImportFirebaseContext): Promise<PlanTier> => {
  const saved = await readDocument([`planSlugs`, slug], context);
  if (!saved || Object.keys(saved.fields).some(key => ![`id`, `slug`, `number`, `displayOrder`].includes(key))) throw new FeatureAccessError(503, `plan_access_unavailable`, `Plan Access Could Not Be Confirmed — Try Again`);
  const id = decodeField(saved.fields.id);
  const number = decodeField(saved.fields.number);
  const displayOrder = decodeField(saved.fields.displayOrder);
  if (typeof id !== `string` || decodeField(saved.fields.slug) !== slug || typeof number !== `number` || number < 1
    || getAppCollectionIDNumber(id, `Plan`) !== number || typeof displayOrder !== `number` || displayOrder < 0) throw new FeatureAccessError(503, `plan_access_unavailable`, `Plan Access Could Not Be Confirmed — Try Again`);
  return { id, slug, number, displayOrder };
};

export const requireStarterFeatureAccess = async (request: Request, signal: AbortSignal) => {
  const token = request.headers.get(`authorization`)?.match(/^Bearer ([A-Za-z0-9._-]+)$/i)?.[1];
  if (!token || token.length > 8192) throw new FeatureAccessError(401, `sign_in_required`, `Sign In And Choose Starter Or Higher To Unlock Auctions`);
  if (!firebaseEnabled) throw new FeatureAccessError(503, `plan_access_unavailable`, `Connect Firebase To Confirm Your Plan Access`);
  try {
    const context: ImportFirebaseContext = { token, signal, readVersions: new Map() };
    const firebaseUid = await verifyFirebaseToken(context);
    const id = await requireSignedInUser(firebaseUid, context);
    const saved = await readDocument([`users`, id], context);
    const active = saved?.fields.active ? decodeField(saved.fields.active) === true : false;
    const role = saved?.fields.role ? decodeField(saved.fields.role) : ``;
    if (!saved || !active || decodeField(saved.fields.id) !== id || decodeField(saved.fields.firebase_uid) !== firebaseUid) throw new FeatureAccessError(403, `account_access_unavailable`, `This Account Is Unavailable`);
    if (role === `Owner`) return;
    const rawPlan = saved?.fields.plan ? decodeField(saved.fields.plan) : undefined;
    const plan = typeof rawPlan === `string` ? rawPlan.trim().toLowerCase() : ``;
    if (!plan || plan === `free` || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(plan) || plan.length > 100) throw new FeatureAccessError(403, `starter_plan_required`, `Choose Starter Or Higher To Unlock Auctions`);
    const tiers = await Promise.all([...new Set([`starter`, plan])].map(slug => readTier(slug, context)));
    if (!hasStarterPlanAccess({ id, plan, active, role: typeof role === `string` ? role : `` }, tiers)) throw new FeatureAccessError(403, `starter_plan_required`, `Choose Starter Or Higher To Unlock Auctions`);
  } catch (failure) {
    if (failure instanceof FeatureAccessError) throw failure;
    if (failure instanceof RegistrarRelayError) throw new FeatureAccessError(failure.status, `plan_access_unavailable`, failure.status === 401 ? `Sign In Again To Unlock Auctions` : `Plan Access Could Not Be Confirmed — Try Again`);
    throw new FeatureAccessError(503, `plan_access_unavailable`, `Plan Access Could Not Be Confirmed — Try Again`);
  }
};
