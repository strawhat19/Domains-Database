import { Roles } from '../../types/types';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../shared/authContext/useAuth';
import { useTheme } from '../../shared/themeContext/useTheme';
import { formSubmissionsAPI } from '../../api/formSubmissions';
import { useCollectionPage } from '../../shared/firebase/useCollectionPage';
import type { FormSubmission } from '../../shared/models/forms/FormSubmission';

export const submissionStatuses = [
  { value: `new`, label: `New`, color: `success` },
  { value: `read`, label: `Read`, color: `muted` },
  { value: `archived`, label: `Archived`, color: `danger` },
] as const;

export const submissionDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? `—` : date.toLocaleString();
};

const errorMessage = (failure: unknown, fallback: string) => failure instanceof Error ? failure.message : fallback;

export const useFormSubmissions = () => {
  const { palette } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const actor = !authLoading && user?.active && user.role === Roles.Owner ? user.id : ``;
  const pageState = useCollectionPage(actor, formSubmissionsAPI.subscribeSubmissionsPage);
  const requestRef = useRef(pageState.request);
  const pending = useRef(``);
  const [search, setSearch] = useState(``);
  const [statusFilter, setStatusFilter] = useState(`all`);
  const [notice, setNotice] = useState({ actor, message: `` });
  const [mutation, setMutation] = useState({ request: pageState.request, savingId: ``, error: `` });
  requestRef.current = pageState.request;
  useEffect(() => {
    pending.current = ``;
    setMutation({ request: pageState.request, savingId: ``, error: `` });
  }, [pageState.request]);
  const scoped = mutation.request === pageState.request ? mutation : { savingId: ``, error: `` };
  const disabled = pageState.loading || !!scoped.savingId;
  const query = search.trim().toLocaleLowerCase();
  const filtered = !!query || statusFilter !== `all`;
  const visible = pageState.records.filter(record => (statusFilter === `all` || record.status === statusFilter) && [record.number, record.name, record.email, record.phone, record.subject, record.message, record.status].join(` `).toLocaleLowerCase().includes(query));

  const updateStatus = async (id: string, status: FormSubmission[`status`]) => {
    const saved = pageState.records.find(submission => submission.id === id);
    if (!actor || disabled || pending.current || !saved || saved.status === status) return;
    const request = pageState.request;
    const operation = `${request}:${id}`;
    const current = () => requestRef.current === request;
    pending.current = operation;
    setNotice({ actor, message: `` });
    setMutation({ request, savingId: id, error: `` });
    try {
      await formSubmissionsAPI.updateSubmissionStatus(id, status);
      if (current()) setNotice({ actor, message: `Submission Status Updated` });
    } catch (failure) {
      if (current()) setMutation(previous => ({ ...previous, error: errorMessage(failure, `Could Not Update Submission Status`) }));
    } finally {
      if (pending.current === operation) pending.current = ``;
      if (current()) setMutation(previous => ({ ...previous, savingId: `` }));
    }
  };
  return {
    ...pageState,
    palette,
    search,
    visible,
    filtered,
    setSearch,
    statusFilter,
    setStatusFilter,
    notice: notice.actor === actor ? notice.message : ``,
    disabled,
    updateStatus,
    allowed: !!actor,
    savingId: scoped.savingId,
    submissions: pageState.records,
    error: scoped.error || pageState.error,
    nextPage: () => { if (!disabled) pageState.nextPage(); },
    previousPage: () => { if (!disabled) pageState.previousPage(); },
    refresh: () => { if (!disabled) pageState.refresh(); },
  };
};
