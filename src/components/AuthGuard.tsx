import  { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface AuthGuardProps {
  allowedRoles: UserRole[];
  children: JSX.Element;
}

export const AuthGuard = ({ allowedRoles, children }: AuthGuardProps) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!currentUser.approved && currentUser.role !== UserRole.ADMIN) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
 