import { useRef, useState } from 'react';
import { usePlanScores } from './usePlanScores';
import { useLocalStorage } from '../../shared/config';
import { formatPlanPrice, billingLabels } from './values';
import { plansAPI, type PlanInput } from '../../api/plans';
import { useAuth } from '../../shared/authContext/useAuth';
import type { Plan } from '../../shared/models/plans/Plan';
import { firebaseEnabled } from '../../shared/firebase/config';
import { canManagePlans } from '../../shared/admin/permissions';
import { useCollectionPage } from '../../shared/firebase/useCollectionPage';

type Editor = Plan | `new` | null;
const emptyControls = (actor: string) => ({ actor, search: ``, filter: `all`, archivingId: ``, editor: null as Editor });
export const useAdminPlans = () => {
  const { user } = useAuth();
  const scores = usePlanScores();
  const allowed = canManagePlans(user);
  const actor = allowed ? `${user?.id}:${user?.role}` : ``;
  const page = useCollectionPage(actor, plansAPI.subscribePlansPage);
  const [controls, setControls] = useState(() => emptyControls(actor));
  const [feedback, setFeedback] = useState({ actor, busy: ``, error: ``, notice: `` });
  const scope = useRef(actor);
  const pending = useRef<{ actor: string } | null>(null);
  scope.current = actor;
  const current = controls.actor === actor ? controls : emptyControls(actor);
  const response = feedback.actor === actor ? feedback : { actor, busy: ``, error: ``, notice: `` };
  const clearFeedback = (preserveNotice = false) => setFeedback(state => ({ actor, busy: state.actor === actor ? state.busy : ``, error: ``, notice: preserveNotice && state.actor === actor ? state.notice : `` }));
  const setControl = <K extends keyof ReturnType<typeof emptyControls>>(key: K, value: ReturnType<typeof emptyControls>[K]) => setControls(state => ({ ...(state.actor === actor ? state : emptyControls(actor)), [key]: value }));
  const query = current.search.trim().toLocaleLowerCase();
  const records = page.records;
  const matchingRecords = records.filter(plan => (current.filter === `all` || (plan.active ? `active` : `inactive`) === current.filter) && [plan.number, plan.name, plan.slug, plan.description, plan.currency, plan.features.join(` `), plan.active ? `Active` : `Inactive`, plan.highlighted ? `Highlighted` : ``, plan.displayOrder, billingLabels[plan.billingInterval], formatPlanPrice(plan)].join(` `).toLocaleLowerCase().includes(query));
  const active = records.filter(plan => plan.active).length;
  const runMutation = async (id: string, operation: () => Promise<unknown>, notice: string) => {
    if (!actor || pending.current?.actor === actor) return false;
    const request = { actor };
    pending.current = request;
    setFeedback({ actor, notice: ``, error: ``, busy: id });
    try {
      await operation();
      if (scope.current !== actor) return false;
      setFeedback({ actor, notice, error: ``, busy: `` });
      return true;
    } catch (failure) {
      if (scope.current === actor) setFeedback({ actor, busy: ``, notice: ``, error: failure instanceof Error ? failure.message : `Plan Could Not Be Saved` });
      return false;
    } finally { if (pending.current === request) pending.current = null; }
  };
  const save = async (input: PlanInput, id?: string) => {
    const saved = await runMutation(id ?? `new`, () => id ? plansAPI.updatePlan(id, input) : plansAPI.createPlan(input), `Plan Saved`);
    if (saved && !id) page.refresh();
    return saved;
  };
  const archive = (plan: Plan) => runMutation(plan.id, () => plansAPI.archivePlan(plan.id), `Plan Archived`);
  const changeStatus = (plan: Plan) => runMutation(plan.id, () => plansAPI.setPlanActive(plan.id, !plan.active), plan.active ? `Plan Deactivated` : `Plan Activated`);
  return {
    page, save, scores, active, allowed, archive, records, changeStatus, matchingRecords,
    refresh: () => { page.refresh(); scores.refresh(); },
    editor: current.editor,
    search: current.search,
    filter: current.filter,
    notice: response.notice,
    pendingId: response.busy,
    archivingId: current.archivingId,
    error: response.error || page.error,
    busy: !!response.busy || page.loading,
    mode: firebaseEnabled && !useLocalStorage ? `Firebase Realtime` : useLocalStorage ? `Local Demo · This Device` : `Connection Needed`,
    setSearch: (value: string) => setControl(`search`, value),
    setFilter: (value: string) => setControl(`filter`, value),
    closeEditor: () => { clearFeedback(true); setControl(`editor`, null); },
    cancelArchive: () => setControl(`archivingId`, ``),
    edit: (plan: Plan | `new`) => { clearFeedback(); setControl(`archivingId`, ``); setControl(`editor`, plan); },
    requestArchive: (plan: Plan) => { clearFeedback(); setControl(`editor`, null); setControl(`archivingId`, plan.id); },
  };
};
