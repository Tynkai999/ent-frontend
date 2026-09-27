import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import type { Role } from '../models/User.model';
import { useAuth } from '../contexts/AuthContext';

interface RoleRouteProps {
  roles: Role[];
}

/** Filtre l'accès aux écrans d'administration par rôle — la vraie
 * autorisation reste imposée côté API (principe #7 du cahier des charges) ;
 * ceci n'évite qu'un aller-retour inutile pour un utilisateur qui n'a de
 * toute façon pas les droits. */
export const RoleRoute: React.FC<RoleRouteProps> = ({ roles }) => {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
