import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type Props = { children: React.ReactNode };

const CreatorRoute: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const roles = user?.roles || [];
  const isCreatorOrAdmin = Array.isArray(roles)
    ? (roles as any[]).some((r: any) => (typeof r === 'string' ? r : r?.name) === 'creator') ||
      (roles as any[]).some((r: any) => (typeof r === 'string' ? r : r?.name) === 'admin')
    : false;

  if (!isCreatorOrAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default CreatorRoute;
