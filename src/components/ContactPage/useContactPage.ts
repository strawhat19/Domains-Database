import { contactFields } from './content';
import { useRef, useState, useEffect } from 'react';
import { useLocalStorage } from '../../shared/config';
import { useAuth } from '../../shared/authContext/useAuth';
import { formSubmissionsAPI } from '../../api/formSubmissions';

type ContactField = typeof contactFields[number][`id`];
type ContactFields = Record<ContactField | `website`, string>;
type FieldErrors = Partial<Record<ContactField, string>>;
type SavedSubmission = Awaited<ReturnType<typeof formSubmissionsAPI.submitContact>>;

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
  const mounted = useRef(true);
  const submitting = useRef(false);
  const touched = useRef(new Set<ContactField | `website`>());
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(``);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState<SavedSubmission | null>(null);
  const [fields, setFields] = useState<ContactFields>({ name: ``, email: ``, phone: ``, subject: ``, message: ``, website: `` });

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (loading) return;
    setFields(current => ({
      ...current,
      name: touched.current.has(`name`) ? current.name : user?.name ?? ``,
      email: touched.current.has(`email`) ? current.email : user?.email ?? ``,
    }));
  }, [loading, user?.id, user?.name, user?.email]);

  const updateField = (field: ContactField | `website`, value: string) => {
    if (submitting.current) return;
    touched.current.add(field);
    setFeedback(``);
    setErrors(current => ({ ...current, [field]: undefined }));
    setFields(current => ({ ...current, [field]: value }));
  };

  const submit = async () => {
    if (submitting.current) return;
    const nextErrors: FieldErrors = {};
    const input = { ...fields, name: fields.name.trim(), email: fields.email.trim(), phone: fields.phone.trim(), subject: fields.subject.trim(), message: fields.message.trim() };
    contactFields.forEach(field => {
      if (field.id !== `phone` && !input[field.id]) nextErrors[field.id] = `${field.label} Is Required`;
      else if (input[field.id].length > field.limit) nextErrors[field.id] = `${field.label} Must Be ${field.limit} Characters Or Fewer`;
    });
    if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) nextErrors.email = `Enter A Valid Email Address`;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { setFeedback(`Please Check The Highlighted Fields`); return; }
    submitting.current = true;
    setPending(true);
    setFeedback(``);
    try {
      const submission = await formSubmissionsAPI.submitContact(input);
      if (!mounted.current) return;
      setSubmitted(submission);
      setFields(current => ({ ...current, subject: ``, message: ``, website: `` }));
      setFeedback(copy.feedback);
    } catch (error) {
      if (mounted.current) setFeedback(error instanceof Error ? error.message : copy.error);
    } finally {
      submitting.current = false;
      if (mounted.current) setPending(false);
    }
  };

  const sendAnother = () => { setSubmitted(null); setFeedback(``); setErrors({}); };
  const clearFeedback = () => setFeedback(``);
  return { copy, fields, errors, pending, feedback, submitted, submit, updateField, sendAnother, clearFeedback };
};
