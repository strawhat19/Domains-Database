import { useState } from 'react';
import { useLocalStorage } from '../../shared/config';
import { resolveAuthReturnTo } from '../../shared/routes';
import { useAuth } from '../../shared/authContext/useAuth';
import { useLocalSearchParams, useRouter } from 'expo-router';

export type AuthMode = `signin` | `signup`;
type Field = `name` | `email` | `password` | `confirmation`;

export const useAuthForm = (mode: AuthMode) => {
  const auth = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const returnTo = resolveAuthReturnTo(params.returnTo);
  const [feedback, setFeedback] = useState(``);
  const [showPassword, setShowPassword] = useState(false);
  const [fields, setFields] = useState({ name: ``, email: ``, password: ``, confirmation: `` });
  const disabled = auth.loading || auth.busy;
  const signingUp = mode === `signup`;

  const updateField = (field: Field, value: string) => {
    setFeedback(``);
    auth.clearError();
    auth.clearNotice();
    setFields(current => ({ ...current, [field]: value }));
  };

  const submit = async () => {
    if (disabled) return;
    setFeedback(``);
    auth.clearError();
    auth.clearNotice();
    if (!useLocalStorage) { setFeedback(`Backend Is Not Connected`); return; }
    if (signingUp && !fields.name.trim()) { setFeedback(`Enter Your Name`); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) { setFeedback(`Enter A Valid Email Address`); return; }
    if (fields.password.length < 8) { setFeedback(`Use At Least 8 Password Characters`); return; }
    if (signingUp && fields.password !== fields.confirmation) { setFeedback(`Passwords Must Match`); return; }
    try {
      const input = { email: fields.email.trim(), password: fields.password };
      if (signingUp) await auth.signUp({ ...input, name: fields.name.trim() });
      else await auth.signIn(input);
      setFields({ name: ``, email: ``, password: ``, confirmation: `` });
      router.replace(returnTo);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : `Could Not Access Your Account`);
    }
  };

  const navigate = (href: `/signin` | `/signup` | `/profile`) => {
    if (disabled) return;
    if (href === `/profile`) router.push(href);
    else router.push({ pathname: href, params: { returnTo } });
  };

  const clearFeedback = () => { setFeedback(``); auth.clearError(); };

  return {
    auth,
    fields,
    submit,
    disabled,
    navigate,
    signingUp,
    updateField,
    clearFeedback,
    showPassword,
    setShowPassword,
    error: feedback || auth.error,
  };
};
