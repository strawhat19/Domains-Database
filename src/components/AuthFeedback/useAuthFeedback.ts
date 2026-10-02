import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { useAuth } from '../../shared/authContext/useAuth';

export const useAuthFeedback = () => {
  const pathname = usePathname();
  const auth = useAuth();
  useEffect(() => {
    if (!auth.notice) return;
    const timer = setTimeout(auth.clearNotice, 4500);
    return () => clearTimeout(timer);
  }, [auth.notice, auth.clearNotice]);
  return { ...auth, visible: pathname !== `/signin` && pathname !== `/signup` };
};
