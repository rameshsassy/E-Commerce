import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getSellerPortalOrigin,
  isCustomerPortal,
  isLocalHostname,
} from '../../utils/portalHost';

/**
 * On the customer host, /seller/* on production redirects to the seller subdomain.
 * On localhost, /seller/* stays on the same origin (see App.jsx).
 */
export default function PortalRouteGuard({ children }) {
  const location = useLocation();
  const onLocal = isLocalHostname(window.location.hostname);

  useEffect(() => {
    if (!isCustomerPortal()) return;
    if (!location.pathname.startsWith('/seller')) return;
    if (onLocal) return;

    const target = `${getSellerPortalOrigin()}${location.pathname}${location.search}`;
    window.location.replace(target);
  }, [location.pathname, location.search, onLocal]);

  if (isCustomerPortal() && location.pathname.startsWith('/seller') && !onLocal) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-text-muted text-sm">
        Redirecting to seller portal…
      </div>
    );
  }

  return children;
}
