import { feedbackAPI } from '../../api/feedback';
import { useRef, useState, useEffect } from 'react';
import { generateID } from '../../shared/common/ids';
import { useLocalStorage } from '../../shared/config';
import { useAuth } from '../../shared/authContext/useAuth';
import { formSubmissionsAPI } from '../../api/formSubmissions';
import { contactFields, feedbackFormFields, guestFeedbackFields } from './content';
import { normalizePublicMediaUrl } from '../../shared/feedback/validation';
import { feedbackLimits, type FeedbackReceipt, type SupportThread } from '../../shared/feedback/types';

export type ContactTab = `contact` | `review` | `bug`;
type ContactField = typeof contactFields[number][`id`];
type ContactFields = Record<ContactField | `website`, string>;
type FieldErrors = Partial<Record<ContactField, string>>;
type SavedSubmission = Awaited<ReturnType<typeof formSubmissionsAPI.submitContact>>;
type FeedbackDraft = { title: string; description: string; mediaUrl: string; rating: number };
type DraftErrors = Partial<Record<keyof FeedbackDraft, string>>;

const emptyFields = (): ContactFields => ({ name: ``, email: ``, phone: ``, subject: ``, message: ``, website: `` });
const emptyDraft = (): FeedbackDraft => ({ title: ``, description: ``, mediaUrl: ``, rating: 0 });
const copy = {
  submit: `Save Message`,
  pending: `Saving Message…`,
  another: `Save Another Message`,
  title: useLocalStorage ? `Your note is saved.` : `Thanks for reaching out.`,
  error: `Could Not Save Your Message — Please Try Again`,
  feedback: useLocalStorage ? `Message Saved On This Device` : `Message Saved`,
  eyebrow: useLocalStorage ? `MESSAGE SAVED ON THIS DEVICE` : `MESSAGE SAVED`,
  description: useLocalStorage ? `Your message is saved on this device.` : `Your message is saved for the team to review. Thanks for reaching out.`,
};

export const useContactPage = () => {
  const { user, loading } = useAuth();
  const scope = user?.id ? `${user.id}:${user.active}` : loading ? `pending` : `guest`;
  const mounted = useRef(true);
  const submitting = useRef(false);
  const requestRevision = useRef(0);
  const currentScope = useRef(scope);
  const attempts = useRef<Partial<Record<ContactTab, { payload: string; id: string }>>>({});
  const touched = useRef(new Set<ContactField | `website`>());
  const [savedScope, setSavedScope] = useState(scope);
  const [tab, setTabState] = useState<ContactTab>(`contact`);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(``);
  const [feedbackKind, setFeedbackKind] = useState<`success` | `error`>(`error`);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [draftErrors, setDraftErrors] = useState<DraftErrors>({});
  const [review, setReview] = useState<FeedbackDraft>(emptyDraft);
  const [bug, setBug] = useState<FeedbackDraft>(emptyDraft);
  const [submitted, setSubmitted] = useState<SavedSubmission | null>(null);
  const [feedbackSubmission, setFeedbackSubmission] = useState<FeedbackReceipt | null>(null);
  const [supportThread, setSupportThread] = useState<SupportThread | null>(null);
  const [conversationRevision, setConversationRevision] = useState(0);
  const [conversation, setConversation] = useState<{ scope: string; loading: boolean; error: string; thread: SupportThread | null }>({ scope, loading: true, error: ``, thread: null });
  const [fields, setFields] = useState<ContactFields>(emptyFields);
  currentScope.current = scope;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; requestRevision.current++; };
  }, []);

  useEffect(() => {
    if (savedScope === scope) return;
    requestRevision.current++;
    submitting.current = false;
    attempts.current = {};
    touched.current.clear();
    setPending(false);
    setFeedback(``);
    setErrors({});
    setDraftErrors({});
    setSubmitted(null);
    setFeedbackSubmission(null);
    setSupportThread(null);
    setTabState(`contact`);
    setReview(emptyDraft());
    setBug(emptyDraft());
    setFields({ ...emptyFields(), name: user?.name ?? ``, email: user?.email ?? `` });
    setSavedScope(scope);
  }, [scope, savedScope, user?.name, user?.email]);

  useEffect(() => {
    if (loading) return;
    setFields(current => ({
      ...current,
      name: touched.current.has(`name`) ? current.name : user?.name ?? ``,
      email: touched.current.has(`email`) ? current.email : user?.email ?? ``,
    }));
  }, [loading, user?.id, user?.name, user?.email]);

  useEffect(() => {
    if (loading || !user?.id || !user.active) return;
    let active = true;
    const accountId = user.id;
    setConversation({ scope, loading: true, error: ``, thread: null });
    const stop = feedbackAPI.subscribeThreads(records => {
      if (!active || currentScope.current !== scope) return;
      const thread = records.find(record => record.customerId === accountId) ?? null;
      setConversation({ scope, loading: false, error: ``, thread });
      if (thread) setSupportThread(current => current?.id === thread.id ? thread : current);
    }, failure => {
      if (active && currentScope.current === scope) setConversation({ scope, loading: false, error: failure.message, thread: null });
    }, false);
    return () => { active = false; stop(); };
  }, [scope, loading, user?.id, user?.active, conversationRevision]);

  const signedIn = !loading && Boolean(user?.id && user.active);
  const accountUnavailable = !loading && Boolean(user?.id && !user.active);
  const scoped = savedScope === scope;
  const setTab = (value: ContactTab) => {
    if (submitting.current || loading || !scoped || accountUnavailable) return;
    setTabState(value);
    setFeedback(``);
    setErrors({});
    setDraftErrors({});
    setSubmitted(null);
    setFeedbackSubmission(null);
  };
  const updateField = (field: ContactField | `website`, value: string) => {
    if (submitting.current) return;
    touched.current.add(field);
    delete attempts.current[tab];
    setFeedback(``);
    setErrors(current => ({ ...current, [field]: undefined }));
    setFields(current => ({ ...current, [field]: value }));
  };
  const updateDraft = <Field extends keyof FeedbackDraft>(field: Field, value: FeedbackDraft[Field]) => {
    if (submitting.current || loading || !scoped || accountUnavailable) return;
    delete attempts.current[tab];
    setFeedback(``);
    setDraftErrors(current => ({ ...current, [field]: undefined }));
    (tab === `review` ? setReview : setBug)(current => ({ ...current, [field]: value }));
  };

  const submit = async () => {
    if (submitting.current || loading || !scoped || accountUnavailable) return;
    setFeedbackKind(`error`);
    const nextErrors: FieldErrors = {};
    const nextDraftErrors: DraftErrors = {};
    const input = { ...fields, name: fields.name.trim(), email: fields.email.trim(), phone: fields.phone.trim(), subject: fields.subject.trim(), message: fields.message.trim() };
    const draft = tab === `review` ? review : bug;
    let mediaUrl = ``;
    if (!signedIn || tab === `contact`) {
      contactFields.forEach(field => {
        if (signedIn && (field.id === `name` || field.id === `email`)) return;
        if (tab !== `contact` && ![`name`, `email`, `phone`].includes(field.id)) return;
        if (field.id !== `phone` && !input[field.id]) nextErrors[field.id] = `${field.label} Is Required`;
        else if (input[field.id].length > field.limit) nextErrors[field.id] = `${field.label} Must Be ${field.limit} Characters Or Fewer`;
      });
      if (!signedIn && input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) nextErrors.email = `Enter A Valid Email Address`;
    }
    if (tab !== `contact`) {
      if (draft.title.trim().length > feedbackLimits.title) nextDraftErrors.title = `Title Must Be ${feedbackLimits.title} Characters Or Fewer`;
      if (draft.description.trim().length > feedbackLimits.description) nextDraftErrors.description = `Description Must Be ${feedbackLimits.description} Characters Or Fewer`;
      if (tab === `review`) {
        if (!Number.isInteger(draft.rating) || draft.rating < 1 || draft.rating > 5) nextDraftErrors.rating = `Choose A Rating From 1 To 5`;
        if (!draft.description.trim()) nextDraftErrors.description = `Review Is Required`;
      } else {
        try { mediaUrl = normalizePublicMediaUrl(draft.mediaUrl); }
        catch (failure) { nextDraftErrors.mediaUrl = failure instanceof Error ? failure.message : `Enter A Public HTTPS Media URL`; }
        if (!draft.description.trim() && !draft.mediaUrl.trim()) nextDraftErrors.description = `Add A Description Or A Public Screenshot Or Video URL`;
      }
    }
    setErrors(nextErrors);
    setDraftErrors(nextDraftErrors);
    if (Object.keys(nextErrors).length || Object.keys(nextDraftErrors).length) { setFeedback(`Please Check The Highlighted Fields`); return; }
    const guest = { name: input.name, email: input.email, phone: input.phone, website: input.website };
    const payload = JSON.stringify([scope, tab, tab === `contact` ? signedIn ? [input.subject, input.message, input.phone] : input : [signedIn ? null : guest, draft]]);
    const previousAttempt = attempts.current[tab];
    const attempt = previousAttempt?.payload === payload ? previousAttempt : { payload, id: generateID() };
    attempts.current[tab] = attempt;
    const attemptId = attempt.id;
    const revision = ++requestRevision.current;
    const validRequest = () => mounted.current && currentScope.current === scope && requestRevision.current === revision;
    submitting.current = true;
    setPending(true);
    setFeedback(``);
    setFeedbackKind(`error`);
    try {
      if (!signedIn && tab === `contact`) {
        const submission = await formSubmissionsAPI.submitContact(input);
        if (!validRequest()) return;
        setSubmitted(submission);
        setFields(current => ({ ...current, subject: ``, message: ``, website: `` }));
        setFeedback(copy.feedback);
      } else if (tab === `contact`) {
        const thread = await feedbackAPI.submitContact({ subject: input.subject, message: input.message, ...(input.phone ? { phone: input.phone } : {}) }, attemptId);
        if (!validRequest()) return;
        setSupportThread(thread);
        setFields(current => ({ ...current, subject: ``, message: ``, website: `` }));
        setFeedback(`Conversation Opened`);
      } else {
        const reviewInput = { rating: draft.rating, title: draft.title.trim(), description: draft.description.trim() };
        const bugInput = { title: draft.title.trim(), description: draft.description.trim(), mediaUrl };
        const entry = signedIn
          ? tab === `review` ? await feedbackAPI.submitReview(reviewInput, attemptId) : await feedbackAPI.submitBug(bugInput, attemptId)
          : tab === `review` ? await feedbackAPI.submitGuestReview({ ...guest, ...reviewInput }, attemptId) : await feedbackAPI.submitGuestBug({ ...guest, ...bugInput }, attemptId);
        if (!validRequest()) return;
        setFeedbackSubmission(entry);
        (tab === `review` ? setReview : setBug)(emptyDraft());
        setFeedback(tab === `review` ? `Review Saved` : `Bug Report Saved`);
      }
      setFeedbackKind(`success`);
      delete attempts.current[tab];
    } catch (failure) {
      if (validRequest()) setFeedback(failure instanceof Error ? failure.message : `Could Not Save Feedback — Please Try Again`);
    } finally {
      if (validRequest()) { submitting.current = false; setPending(false); }
    }
  };

  const sendAnother = () => { setSubmitted(null); setFeedbackSubmission(null); setFeedback(``); setErrors({}); setDraftErrors({}); };
  const closeConversation = () => { setSupportThread(null); setFeedback(``); delete attempts.current.contact; };
  const openConversation = () => {
    if (submitting.current || !signedIn || conversation.scope !== scope || !conversation.thread) return;
    setSupportThread(conversation.thread);
    setFeedback(``);
  };
  const refreshConversation = () => setConversationRevision(value => value + 1);
  const clearFeedback = () => setFeedback(``);
  const activeTab = scoped ? tab : `contact`;
  const visibleFields = scoped ? fields : emptyFields();
  const visibleDraft = scoped ? tab === `review` ? review : bug : emptyDraft();
  const visibleErrors: FieldErrors = scoped ? errors : {};
  const visibleDraftErrors: DraftErrors = scoped ? draftErrors : {};
  const inputFields = [...(!signedIn ? guestFeedbackFields : []), ...feedbackFormFields[activeTab].filter(field => signedIn || field.id !== `phone`)].map(field => {
    const id = field.id;
    if (id === `name` || id === `email` || id === `subject` || id === `phone` || id === `message`) return {
      ...field, value: visibleFields[id], error: visibleErrors[id], onChange: (value: string) => updateField(id, value),
    };
    return { ...field, value: visibleDraft[id], error: visibleDraftErrors[id], onChange: (value: string) => updateDraft(id, value) };
  });
  return {
    copy, submit, setTab, updateField, updateDraft, sendAnother, clearFeedback, openConversation, closeConversation, refreshConversation,
    signedIn, accountUnavailable, authLoading: loading, userName: user?.name ?? user?.email ?? `Your Account`,
    inputFields, feedbackKind, tab: activeTab as ContactTab,
    conversationLoading: signedIn && (conversation.scope !== scope || conversation.loading),
    conversationError: signedIn && conversation.scope === scope ? conversation.error : ``,
    ownThread: signedIn && conversation.scope === scope ? conversation.thread : null,
    fields: visibleFields, errors: visibleErrors, draftErrors: visibleDraftErrors,
    draft: scoped ? tab === `review` ? review : bug : emptyDraft(), pending: scoped && pending, feedback: scoped ? feedback : ``,
    submitted: scoped ? submitted : null, supportThread: scoped ? supportThread : null, feedbackSubmission: scoped ? feedbackSubmission : null,
  };
};
