import { useLocation } from 'react-router-dom';
import { NAV_ROUTES } from '@/lib/constants';

/**
 * Returns the current active nav route definition, if any.
 */
export function useActiveRoute() {
  const { pathname } = useLocation();
  return NAV_ROUTES.find((r) => r.path === pathname) ?? null;
}
