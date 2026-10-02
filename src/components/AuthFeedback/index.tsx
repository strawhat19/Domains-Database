import Toast from '../Toast';
import { useAuthFeedback } from './useAuthFeedback';

const AuthFeedback = () => {
  const auth = useAuthFeedback();
  if (!auth.visible) return null;
  return <Toast id={`auth-feedback`} message={auth.error || auth.notice || ``} kind={auth.error ? `error` : `success`} onDismiss={auth.error ? auth.clearError : auth.clearNotice} />;
};

export default AuthFeedback;
