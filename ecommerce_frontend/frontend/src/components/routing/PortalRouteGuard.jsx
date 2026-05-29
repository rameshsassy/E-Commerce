import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getSellerPortalOrigin,
  isCustomerPortal,
  isLocalHostname,
  isPreviewHostname,
} from '../../utils/portalHost';

/**
 * On the customer host, /seller/* on production redirects to the seller subdomain.
 * On localhost, /seller/* stays on the same origin (see App.jsx).
 */
export default function PortalRouteGuard({ children }) {
  const location = useLocation();
  const host = window.location.hostname;
  const onLocal = isLocalHostname(host);
  const onPreview = isPreviewHostname(host);

  useEffect(() => {
    if (!isCustomerPortal()) return;
    if (!location.pathname.startsWith('/seller')) return;
    if (onLocal || onPreview) return;

    const target = `${getSellerPortalOrigin()}${location.pathname}${location.search}`;
    window.location.replace(target);
  }, [location.pathname, location.search, onLocal, onPreview]);

  if (isCustomerPortal() && location.pathname.startsWith('/seller') && !onLocal && !onPreview) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-text-muted text-sm">
        Redirecting to seller portal…
      </div>
    );
  }

  return children;
}
