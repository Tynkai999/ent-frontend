import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const PrivateRoute: React.FC = () => {
  const { loading, isAuthenticated, serverUnreachable, refresh } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  // Un jeton existe mais le serveur n'a pas répondu : on ne sait pas si
  // l'utilisateur est réellement déconnecté, donc on ne le renvoie pas
  // vers Keycloak (ça boucle sinon avec le cookie SSO déjà valide) — on
  // propose juste de réessayer.
  if (serverUnreachable) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-3 bg-gray-50 text-center p-4">
        <AlertTriangle className="text-red-500" size={28} />
        <p className="text-sm text-gray-600 max-w-sm">
          Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.
        </p>
        <button
          onClick={() => refresh()}
          className="text-sm text-primary hover:text-primary-dark font-medium"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
};
