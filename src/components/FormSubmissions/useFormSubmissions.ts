import { Roles } from '../../types/types';
import { useAuth } from '../../shared/authContext/useAuth';
import { useTheme } from '../../shared/themeContext/useTheme';
import { formSubmissionsAPI } from '../../api/formSubmissions';
import { useCallback, useEffect, useRef, useState } from 'react';
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

interface SubmissionState {
  actor: string;
  error: string;
  loading: boolean;
  savingId: string;
  submissions: FormSubmission[];
}

const emptyState = (actor: string): SubmissionState => ({ actor, error: ``, loading: !!actor, savingId: ``, submissions: [] });
const errorMessage = (failure: unknown, fallback: string) => failure instanceof Error ? failure.message : fallback;

export const useFormSubmissions = () => {
  const { palette } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const actor = !authLoading && user?.active && user.role === Roles.Owner ? user.id : ``;
  const actorRef = useRef(actor);
  const revision = useRef(0);
  const pending = useRef(``);
  const [state, setState] = useState(() => emptyState(actor));
  actorRef.current = actor;

  const refresh = useCallback(async () => {
    if (!actor || actorRef.current !== actor || pending.current) return;
    const request = ++revision.current;
    const current = () => actorRef.current === actor && revision.current === request;
    setState(saved => ({ ...(saved.actor === actor ? saved : emptyState(actor)), error: ``, loading: true }));
    try {
      const submissions = await formSubmissionsAPI.getSubmissions();
      if (current()) setState(saved => ({ ...saved, submissions }));
    } catch (failure) {
      if (current()) setState(saved => ({ ...saved, error: errorMessage(failure, `Could Not Load Form Submission(s)`) }));
    } finally {
      if (current()) setState(saved => ({ ...saved, loading: false }));
    }
  }, [actor]);

  useEffect(() => {
    revision.current++;
    pending.current = ``;
    setState(emptyState(actor));
    void refresh();
    return () => { revision.current++; };
  }, [actor, refresh]);

  const updateStatus = async (id: string, status: FormSubmission[`status`]) => {
    const saved = state.submissions.find(submission => submission.id === id);
    if (!actor || actorRef.current !== actor || state.actor !== actor || state.loading || pending.current || !saved || saved.status === status) return;
    const request = revision.current;
    const operation = `${actor}:${id}:${request}`;
    const current = () => actorRef.current === actor && revision.current === request;
    pending.current = operation;
    setState(previous => ({ ...previous, error: ``, savingId: id }));
    try {
      const submission = await formSubmissionsAPI.updateSubmissionStatus(id, status);
      if (current()) setState(previous => ({ ...previous, submissions: previous.submissions.map(record => record.id === id ? submission : record) }));
    } catch (failure) {
      if (current()) setState(previous => ({ ...previous, error: errorMessage(failure, `Could Not Update Submission Status`) }));
    } finally {
      if (pending.current === operation) pending.current = ``;
      if (current()) setState(previous => ({ ...previous, savingId: `` }));
    }
  };

  const scoped = state.actor === actor ? state : emptyState(actor);
  return { ...scoped, palette, refresh, updateStatus, allowed: !!actor, disabled: scoped.loading || !!scoped.savingId };
};
