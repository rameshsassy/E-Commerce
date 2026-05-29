import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getSellerPortalOrigin,
  isCustomerPortal,
} from '../../utils/portalHost';

/**
 * On the customer portal, send /seller/* paths to seller.aashansh.org.
 */
export default function PortalRouteGuard({ children }) {
  const location = useLocation();

  useEffect(() => {
    if (!isCustomerPortal()) return;
    if (!location.pathname.startsWith('/seller')) return;

    const target = `${getSellerPortalOrigin()}${location.pathname}${location.search}`;
    window.location.replace(target);
  }, [location.pathname, location.search]);

  if (isCustomerPortal() && location.pathname.startsWith('/seller')) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-text-muted text-sm">
        Redirecting to seller portal…
      </div>
    );
  }

  return children;
}
