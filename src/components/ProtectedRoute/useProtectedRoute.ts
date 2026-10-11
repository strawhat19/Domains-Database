import { Roles } from '../../types/types';
import { usePathname, useRouter } from 'expo-router';
import { minRole } from '../../shared/models/users/User';
import { resolveAuthReturnTo } from '../../shared/routes';
import { useAuth } from '../../shared/authContext/useAuth';
import { canAccessAdmin, type AdminSection } from '../../shared/admin/permissions';

export const useProtectedRoute = (requiredRole = Roles.Subscriber, adminSection?: AdminSection) => {
  const auth = useAuth();
  const router = useRouter();
  const returnTo = resolveAuthReturnTo(usePathname());
  const allowed = Boolean(auth.user?.active && (adminSection ? canAccessAdmin(auth.user, adminSection) : minRole(auth.user.role, requiredRole)));
  const navigate = (href: `/signin` | `/signup` | `/profile`) => {
    if (auth.busy) return;
    if (href === `/profile`) router.push(href);
    else router.push({ pathname: href, params: { returnTo } });
  };
  return { auth, allowed, navigate };
};
