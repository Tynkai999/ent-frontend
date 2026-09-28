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

  /** Authentification directe via Keycloak avec identifiants (Resource Owner Password Credentials) */
  async loginWithCredentials(username: string, password: string): Promise<void> {
    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: KEYCLOAK_CLIENT_ID,
      username,
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
      throw new Error("Impossible de joindre le serveur d'authentification Keycloak (ent.tpe.bf).");
    }

    if (!response.ok) {
      let msg = 'Identifiants incorrects ou compte non autorisé.';
      try {
        const data = await response.json();
        if (data.error_description) msg = data.error_description;
      } catch {
        // fallback
      }
      throw new Error(msg);
    }

    const tokens = await response.json();
    localStorage.removeItem('ent_mock_mode');
    localStorage.removeItem('ent_mock_user');
    apiService.setTokens(tokens.access_token, tokens.refresh_token, tokens.id_token);
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

    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

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
