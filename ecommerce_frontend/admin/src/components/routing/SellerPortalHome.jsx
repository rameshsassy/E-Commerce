import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function SellerPortalHome() {
  const { user } = useAuth();
  if (user?.role === 'seller') {
    return <Navigate to="/seller/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
}
