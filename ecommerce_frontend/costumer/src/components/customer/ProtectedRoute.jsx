import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "./EmptyState";

export function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();
  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <LoadingSpinner className="text-primary" />
      </div>
    );
  }
  if (!isAuthenticated)
    return (
      <Navigate
        to="/auth"
        search={{ redirect: window.location.pathname + window.location.search }}
      />
    );
  return <>{children}</>;
}
