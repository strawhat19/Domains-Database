import { useState } from 'react';
import { useRouter } from 'expo-router';
import { routes } from '../../../shared/routes';
import { useAuth } from '../../../shared/authContext/useAuth';

export const useConnectRegistrar = (onClose: () => void, disabled = false) => {
  const auth = useAuth();
  const router = useRouter();
  const [prompt, setPrompt] = useState(false);
  const busy = disabled || auth.busy || auth.loading;
  const navigate = (href: `/signin` | `/signup` | `/profile/connections`) => {
    if (busy) return;
    onClose();
    if (href === routes.connections.href) router.push(href);
    else router.push({ pathname: href, params: { returnTo: routes.connections.href } });
  };
  const connect = () => {
    if (busy) return;
    if (auth.user) navigate(`/profile/connections`);
    else setPrompt(true);
  };
  return { busy, prompt, connect, navigate };
};
