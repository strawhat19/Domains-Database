import { Roles } from '../../types/types';
import { usePathname, useRouter } from 'expo-router';
import { resolveAuthReturnTo } from '../../shared/routes';
import { minRole } from '../../shared/models/users/User';
import { useAuth } from '../../shared/authContext/useAuth';

export const useProtectedRoute = (requiredRole = Roles.Subscriber) => {
  const auth = useAuth();
  const router = useRouter();
  const returnTo = resolveAuthReturnTo(usePathname());
  const allowed = Boolean(auth.user && minRole(auth.user.role, requiredRole));
  const navigate = (href: `/signin` | `/signup` | `/profile`) => {
    if (auth.busy) return;
    if (href === `/profile`) router.push(href);
    else router.push({ pathname: href, params: { returnTo } });
  };
  return { auth, allowed, navigate };
};
