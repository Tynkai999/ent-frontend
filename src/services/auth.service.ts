import { KEYCLOAK_CLIENT_ID, KEYCLOAK_REALM, KEYCLOAK_URL } from '../config/env';
import { apiService } from './api.service';
import { generateCodeChallenge, generateRandomString } from './pkce';
import type { Role, User } from '../models/User.model';
import { MOCK_USERS } from './mockData';

const ISSUER = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`;
const AUTH_ENDPOINT = `${ISSUER}/protocol/openid-connect/auth`;
const TOKEN_ENDPOINT = `${ISSUER}/protocol/openid-connect/token`;
const END_SESSION_ENDPOINT = `${ISSUER}/protocol/openid-connect/logout`;

const VERIFIER_KEY = 'ent_pkce_verifier';
const STATE_KEY = 'ent_pkce_state';
const REDIRECT_KEY = 'ent_post_login_redirect';

const callbackUri = () => `${window.location.origin}/callback`;

export const authService = {
  /** Vérifie si le serveur Keycloak est accessible */
  async checkKeycloak(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${ISSUER}/.well-known/openid-configuration`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(id);
      return res.ok;
    } catch {
      return false;
    }
  },

  /** Extrait les informations utilisateur depuis le token JWT Keycloak (id_token ou access_token) */
  getUserFromToken(token?: string | null): User | null {
    const rawToken = token || apiService.getIdToken() || apiService.getToken();
    if (!rawToken || !rawToken.includes('.')) return null;
    try {
      const parts = rawToken.split('.');
      if (parts.length < 2) return null;
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      base64 += '='.repeat((4 - (base64.length % 4)) % 4);

      let jsonStr = '';
      try {
        jsonStr = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
      } catch {
        jsonStr = atob(base64);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = JSON.parse(jsonStr);
      if (!payload || (!payload.sub && !payload.preferred_username && !payload.email)) {
        return null;
      }

      // Rôles dans le token Keycloak
      const roles: string[] = [
        ...(payload.realm_access?.roles || []),
        ...(payload.resource_access?.[KEYCLOAK_CLIENT_ID]?.roles || []),
      ];

      let role: Role = 'client_user';
      if (
        roles.includes('super_admin') ||
        roles.includes('admin') ||
        roles.includes('administrator') ||
        payload.preferred_username === 'admin'
      ) {
        role = 'super_admin';
      } else if (roles.includes('org_admin')) {
        role = 'org_admin';
      } else if (roles.includes('support')) {
        role = 'support';
      } else if (roles.includes('internal_user')) {
        role = 'internal_user';
      } else if (roles.includes('prospect')) {
        role = 'prospect';
      }

      const email = payload.email || payload.preferred_username || '';
      const firstName = payload.given_name || payload.preferred_username || 'Utilisateur';
      const lastName = payload.family_name || '';
      const fullName = payload.name || `${firstName} ${lastName}`.trim();

      return {
        id: payload.sub || 'user-keycloak',
        email,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        username: payload.preferred_username || email,
        role,
        organization: payload.organization || null,
        organization_name: payload.organization_name || null,
        is_suspended: false,
        keycloak_sub: payload.sub,
      };
    } catch {
      return null;
    }
  },

  /** Authentification directe via Keycloak avec identifiants (Resource Owner Password Credentials) */
  async loginWithCredentials(username: string, password: string): Promise<User | null> {
    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: KEYCLOAK_CLIENT_ID,
      username: username.trim(),
      password,
      scope: 'openid profile email',
    });

    let response: Response;
    try {
      response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
    } catch {
      // Fallback via le proxy local /auth si le direct échoue
      try {
        const localTokenEndpoint = `/auth/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
        response = await fetch(localTokenEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        });
      } catch {
        throw new Error("Impossible de joindre le serveur d'authentification Keycloak (ent.tpe.bf). Vérifiez votre connexion.");
      }
    }

    if (!response.ok) {
      let msg = 'Identifiants incorrects ou compte non autorisé sur ent.tpe.bf.';
      try {
        const data = await response.json();
        if (data.error_description) {
          if (data.error_description === 'Invalid user credentials') {
            msg = 'Identifiant ou mot de passe incorrect.';
          } else {
            msg = data.error_description;
          }
        }
      } catch {
        // fallback
      }
      throw new Error(msg);
    }

    const tokens = await response.json();
    localStorage.removeItem('ent_mock_mode');
    localStorage.removeItem('ent_mock_user');
    apiService.setTokens(tokens.access_token, tokens.refresh_token, tokens.id_token);

    return this.getUserFromToken(tokens.id_token || tokens.access_token);
  },

  /** Connexion en mode démonstration (sans Keycloak ni backend) */
  loginAsMock(role: Role = 'super_admin'): User {
    const user = MOCK_USERS.find((u) => u.role === role) || MOCK_USERS[0];
    localStorage.setItem('ent_mock_mode', 'true');
    localStorage.setItem('ent_mock_user', JSON.stringify(user));
    apiService.setTokens(`mock_access_token_${role}`, 'mock_refresh_token', 'mock_id_token');
    return user;
  },

  isMockMode(): boolean {
    return localStorage.getItem('ent_mock_mode') === 'true';
  },

  /** Redirige le navigateur vers Keycloak (Authorization Code + PKCE) */
  async login(redirectPath = '/dashboard'): Promise<void> {
    if (
      AUTH_ENDPOINT.startsWith(window.location.origin) &&
      !import.meta.env.VITE_DEV_KEYCLOAK_URL &&
      !import.meta.env.VITE_KEYCLOAK_URL
    ) {
      throw new Error(
        "Fournisseur d'identité Keycloak non configuré : l'URL pointe vers le frontend local."
      );
    }

    const verifier = generateRandomString(32);
    const challenge = await generateCodeChallenge(verifier);
    const state = generateRandomString(16);

    sessionStorage.setItem(VERIFIER_KEY, verifier);
    sessionStorage.setItem(STATE_KEY, state);
    sessionStorage.setItem(REDIRECT_KEY, redirectPath);

    const params = new URLSearchParams({
      client_id: KEYCLOAK_CLIENT_ID,
      response_type: 'code',
      scope: 'openid profile email',
      redirect_uri: callbackUri(),
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
    });

    window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`;
  },

  /** Échange le code d'autorisation contre les tokens — appelé depuis AuthCallback.tsx */
  async handleCallback(search: string): Promise<string> {
    const params = new URLSearchParams(search);
    const error = params.get('error');
    if (error) {
      throw new Error(params.get('error_description') || 'Connexion refusée.');
    }

    const code = params.get('code');
    const state = params.get('state');
    const expectedState = sessionStorage.getItem(STATE_KEY);
    const verifier = sessionStorage.getItem(VERIFIER_KEY);

    if (!code || !state || !verifier || state !== expectedState) {
      throw new Error('Requête de connexion invalide ou expirée. Merci de réessayer.');
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: KEYCLOAK_CLIENT_ID,
      code,
      redirect_uri: callbackUri(),
      code_verifier: verifier,
    });

    sessionStorage.removeItem(VERIFIER_KEY);
    sessionStorage.removeItem(STATE_KEY);

    let response: Response;
    try {
      response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
    } catch {
      const localTokenEndpoint = `/auth/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
      response = await fetch(localTokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
    }

    if (!response.ok) {
      throw new Error("Impossible d'obtenir un jeton d'accès. Merci de réessayer.");
    }

    const tokens = await response.json();
    apiService.setTokens(tokens.access_token, tokens.refresh_token, tokens.id_token);

    const redirect = sessionStorage.getItem(REDIRECT_KEY) || '/dashboard';
    sessionStorage.removeItem(REDIRECT_KEY);
    return redirect;
  },

  /** Déconnexion */
  logout(): void {
    const isMock = localStorage.getItem('ent_mock_mode') === 'true';
    const idToken = apiService.getIdToken();
    apiService.clearTokens();
    localStorage.removeItem('ent_mock_mode');
    localStorage.removeItem('ent_mock_user');

    if (isMock || KEYCLOAK_URL.startsWith(window.location.origin)) {
      window.location.href = '/login';
      return;
    }

    const params = new URLSearchParams({
      client_id: KEYCLOAK_CLIENT_ID,
      post_logout_redirect_uri: window.location.origin,
    });
    if (idToken) params.set('id_token_hint', idToken);

    window.location.href = `${END_SESSION_ENDPOINT}?${params.toString()}`;
  },

  isAuthenticated(): boolean {
    return !!apiService.getToken();
  },
};
