import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '../models/User.model';
import { authService } from '../services/auth.service';
import { meService } from '../services/me.service';
import { NetworkError } from '../services/api.service';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  /** Un jeton existe mais on n'a pas pu joindre le serveur pour le
   * vérifier (panne réseau/backend transitoire) — distinct de « pas de
   * jeton du tout ». `PrivateRoute` doit proposer de réessayer plutôt que
   * de rediriger vers Keycloak : sans cette distinction, une panne
   * transitoire du backend déconnecte tout le monde et déclenche un
   * aller-retour Keycloak en boucle alors que le jeton est valide. */
  serverUnreachable: boolean;
  refresh: (initialUser?: User | null) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverUnreachable, setServerUnreachable] = useState(false);

  const refresh = useCallback(async (initialUser?: User | null) => {
    if (initialUser) {
      setUser(initialUser);
      setServerUnreachable(false);
      setLoading(false);
    }

    if (!authService.isAuthenticated()) {
      setUser(null);
      setServerUnreachable(false);
      setLoading(false);
      return;
    }

    try {
      const me = await meService.get();
      setUser(me);
      setServerUnreachable(false);
    } catch (err) {
      // Si l'appel /me/ échoue (ex: endpoint temporairement indisponible, 401 sur l'API DRF, etc.),
      // on tente d'extraire le profil utilisateur directement depuis le JWT Keycloak
      const fallbackUser = initialUser || authService.getUserFromToken();
      if (fallbackUser) {
        setUser(fallbackUser);
        setServerUnreachable(false);
      } else if (err instanceof NetworkError) {
        setServerUnreachable(true);
      } else {
        setUser(null);
        setServerUnreachable(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = () => {
    setUser(null);
    authService.logout();
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, serverUnreachable, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un <AuthProvider>');
  return ctx;
};
