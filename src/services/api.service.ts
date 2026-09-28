import { API_BASE_URL, KEYCLOAK_CLIENT_ID, KEYCLOAK_REALM, KEYCLOAK_URL } from '../config/env';
import {
  MOCK_USERS,
  MOCK_ORGANIZATIONS,
  MOCK_PLATFORMS,
  MOCK_PLATFORMS_FOR_ME,
  MOCK_ACCESS_GRANTS,
  MOCK_PERMISSIONS,
  MOCK_DOCUMENTS,
  MOCK_AUDIT_LOGS,
  MOCK_NOTIFICATIONS,
  MOCK_STATS_OVERVIEW,
  MOCK_INVITATIONS,
  MOCK_MODULES,
  MOCK_PLATFORM_ROLES,
} from './mockData';

const TOKEN_ENDPOINT = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;

/** Distingue un vrai 401 (le token est refusé, on doit se reconnecter)
 * d'un simple problème réseau/serveur injoignable — sans quoi une panne
 * transitoire du backend (redémarrage, proxy dev mal configuré...) se
 * traduit par une déconnexion et un aller-retour Keycloak en boucle,
 * alors que le token de l'utilisateur est parfaitement valide. */
export class NetworkError extends Error {
  constructor() {
    super('Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.');
    this.name = 'NetworkError';
  }
}

// setTimeout encode son délai sur un entier 32 bits signé — un délai plus
// long déborderait et déclencherait le timer presque immédiatement.
const MAX_TIMEOUT_DELAY = 2 ** 31 - 1;

const ACCESS_TOKEN_KEY = 'ent_access_token';
const REFRESH_TOKEN_KEY = 'ent_refresh_token';
const ID_TOKEN_KEY = 'ent_id_token';

class ApiService {
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    const existing = this.getToken();
    if (existing) this.scheduleExpiry(existing);
  }

  private decodeJwtExpiryMs(token: string): number | null {
    if (!token || !token.includes('.')) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      base64 += '='.repeat((4 - (base64.length % 4)) % 4);
      const decoded = JSON.parse(atob(base64)) as { exp?: number };
      return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  private scheduleExpiry(token: string): void {
    if (localStorage.getItem('ent_mock_mode') === 'true') return;
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
    const expiryMs = this.decodeJwtExpiryMs(token);
    if (expiryMs === null) return;

    // Rafraîchit 5s avant l'expiration réelle plutôt qu'à la seconde près,
    // pour absorber la latence réseau de l'appel de refresh lui-même.
    const delay = expiryMs - Date.now() - 5000;
    if (delay <= 0) {
      this.tryRefresh().catch(() => undefined);
      return;
    }
    if (delay > MAX_TIMEOUT_DELAY) {
      this.expiryTimer = setTimeout(() => this.scheduleExpiry(token), MAX_TIMEOUT_DELAY);
      return;
    }
    // Une NetworkError ici (Keycloak momentanément injoignable) est
    // ignorée sans déconnecter personne : la prochaine requête API
    // déclenchera un nouveau refresh réactif via `request()`.
    this.expiryTimer = setTimeout(() => this.tryRefresh().catch(() => undefined), delay);
  }

  /** Ne lance qu'un seul refresh à la fois, même si plusieurs requêtes
   * échouent en 401 simultanément ou si le timer d'expiration se déclenche
   * pendant qu'un refresh est déjà en cours. */
  private tryRefresh(): Promise<string | null> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshTokens().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  private async refreshTokens(): Promise<string | null> {
    if (localStorage.getItem('ent_mock_mode') === 'true') {
      return 'mock_access_token_demo_mode';
    }
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.handleUnauthorized();
      return null;
    }

    let response: Response;
    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: KEYCLOAK_CLIENT_ID,
        refresh_token: refreshToken,
      });
      response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
    } catch {
      // Keycloak injoignable (panne réseau/serveur transitoire) : le
      // refresh token lui-même n'est pas forcément invalide, donc on ne
      // déconnecte pas l'utilisateur pour autant.
      throw new NetworkError();
    }

    if (!response.ok) {
      // Ici, Keycloak a bien répondu et a refusé le refresh token
      // (expiré/révoqué) : c'est une vraie déconnexion.
      this.handleUnauthorized();
      return null;
    }
    const tokens = await response.json();
    this.setTokens(tokens.access_token, tokens.refresh_token, tokens.id_token);
    return tokens.access_token as string;
  }

  private handleUnauthorized(): void {
    this.clearTokens();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  private getFallbackMessage(status: number): string {
    switch (status) {
      case 400: return 'Requête invalide. Veuillez vérifier les données saisies.';
      case 401: return 'Session expirée. Veuillez vous reconnecter.';
      case 403: return "Accès refusé. Vous n'avez pas les permissions nécessaires.";
      case 404: return 'Ressource non trouvée.';
      case 405: return 'Méthode non autorisée.';
      case 429: return 'Trop de tentatives. Veuillez patienter quelques instants avant de réessayer.';
      case 500: return 'Erreur interne du serveur. Veuillez réessayer plus tard.';
      default: return `Erreur serveur (${status}).`;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractErrors(obj: any): string[] {
    let messages: string[] = [];
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (typeof item === 'string') messages.push(item);
        else if (typeof item === 'object' && item !== null) messages = messages.concat(this.extractErrors(item));
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const val = obj[key];
          if (typeof val === 'string') {
            messages.push(`${key}: ${val}`);
          } else if (Array.isArray(val) && val.every((v) => typeof v === 'string')) {
            messages.push(`${key}: ${val.join(', ')}`);
          } else if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
            messages = messages.concat(this.extractErrors(val).map((msg) => `${key}: ${msg}`));
          }
        }
      }
    } else if (typeof obj === 'string') {
      messages.push(obj);
    }
    return messages;
  }

  private parseErrorBody(text: string, status: number): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let errorData: any = {};
    if (text) {
      try {
        errorData = JSON.parse(text);
      } catch {
        if (text.trim().length > 0 && text.trim().length < 500) return text;
        return this.getFallbackMessage(status);
      }
    } else {
      return this.getFallbackMessage(status);
    }

    if (errorData.detail) {
      return typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
    }
    if (errorData.non_field_errors) {
      return Array.isArray(errorData.non_field_errors)
        ? errorData.non_field_errors.join(' \n ')
        : String(errorData.non_field_errors);
    }

    const allErrors = this.extractErrors(errorData);
    if (allErrors.length > 0) return allErrors.join(' \n ');

    return this.getFallbackMessage(status);
  }

  private async getErrorMessage(response: Response): Promise<string> {
    let text = '';
    try {
      text = await response.text();
    } catch {
      return this.getFallbackMessage(response.status);
    }
    return this.parseErrorBody(text, response.status);
  }

  private handleMockRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    const url = endpoint.split('?')[0];
    const queryString = endpoint.includes('?') ? endpoint.split('?')[1] : '';
    const params = new URLSearchParams(queryString);

    return new Promise((resolve) => {
      setTimeout(() => {
        // ME
        if (url === '/me/') {
          const raw = localStorage.getItem('ent_mock_user');
          const user = raw ? JSON.parse(raw) : MOCK_USERS[0];
          return resolve(user as T);
        }
        if (url === '/me/platforms/') {
          return resolve({
            count: MOCK_PLATFORMS_FOR_ME.length,
            next: null,
            previous: null,
            results: MOCK_PLATFORMS_FOR_ME,
          } as T);
        }

        // USERS
        if (url === '/users/' || url.startsWith('/users/')) {
          if (url.includes('/suspend/')) {
            const id = url.split('/')[2];
            const u = MOCK_USERS.find((x) => x.id === id) || MOCK_USERS[0];
            return resolve({ ...u, is_suspended: true } as T);
          }
          if (url.includes('/reactivate/')) {
            const id = url.split('/')[2];
            const u = MOCK_USERS.find((x) => x.id === id) || MOCK_USERS[0];
            return resolve({ ...u, is_suspended: false } as T);
          }
          if (url.includes('/generate_credentials/')) {
            return resolve({ email: 'user@ac-paris.fr', password: 'TempPassword2026!' } as T);
          }
          if (url.includes('/invite/')) {
            return resolve(MOCK_INVITATIONS[0] as T);
          }
          if (url.includes('/sessions/')) {
            return resolve([] as T);
          }
          if (method === 'GET') {
            const search = params.get('search')?.toLowerCase();
            let results = [...MOCK_USERS];
            if (search) {
              results = results.filter(
                (u) =>
                  u.full_name.toLowerCase().includes(search) ||
                  u.email.toLowerCase().includes(search)
              );
            }
            return resolve({
              count: results.length,
              next: null,
              previous: null,
              results,
            } as T);
          }
          if (method === 'POST') {
            const body = options.body ? JSON.parse(options.body as string) : {};
            const newUser = {
              id: `u-${Date.now()}`,
              full_name: `${body.first_name || ''} ${body.last_name || ''}`.trim() || 'Nouvel Utilisateur',
              is_suspended: false,
              is_active: true,
              date_joined: new Date().toISOString(),
              ...body,
            };
            return resolve(newUser as T);
          }
          if (method === 'PATCH' || method === 'PUT') {
            const body = options.body ? JSON.parse(options.body as string) : {};
            return resolve({ ...MOCK_USERS[0], ...body } as T);
          }
          if (method === 'DELETE') {
            return resolve({} as T);
          }
        }

        // ORGANIZATIONS
        if (url === '/organizations/' || url.startsWith('/organizations/')) {
          if (method === 'GET') {
            const search = params.get('search')?.toLowerCase();
            let results = [...MOCK_ORGANIZATIONS];
            if (search) {
              results = results.filter((o) => o.name.toLowerCase().includes(search));
            }
            return resolve({
              count: results.length,
              next: null,
              previous: null,
              results,
            } as T);
          }
          if (method === 'POST') {
            const body = options.body ? JSON.parse(options.body as string) : {};
            const newOrg = { id: `org-${Date.now()}`, users_count: 0, status: 'active', ...body };
            return resolve(newOrg as T);
          }
          if (method === 'PATCH' || method === 'PUT') {
            const body = options.body ? JSON.parse(options.body as string) : {};
            return resolve({ ...MOCK_ORGANIZATIONS[0], ...body } as T);
          }
          if (method === 'DELETE') {
            return resolve({} as T);
          }
        }

        // PLATFORMS
        if (url === '/platforms/' || url.startsWith('/platforms/')) {
          if (url.includes('/sso-redirect/')) {
            return resolve({ url: 'https://moodle.org' } as T);
          }
          if (method === 'GET') {
            return resolve({
              count: MOCK_PLATFORMS.length,
              next: null,
              previous: null,
              results: MOCK_PLATFORMS,
            } as T);
          }
          if (method === 'POST') {
            const body = options.body ? JSON.parse(options.body as string) : {};
            return resolve({ id: `plat-${Date.now()}`, modules: [], roles: [], ...body } as T);
          }
          if (method === 'PATCH' || method === 'PUT') {
            const body = options.body ? JSON.parse(options.body as string) : {};
            return resolve({ ...MOCK_PLATFORMS[0], ...body } as T);
          }
          if (method === 'DELETE') {
            return resolve({} as T);
          }
        }

        // MODULES & ROLES
        if (url.startsWith('/modules/')) {
          return resolve({ count: MOCK_MODULES.length, next: null, previous: null, results: MOCK_MODULES } as T);
        }
        if (url.startsWith('/platform-roles/')) {
          return resolve({ count: MOCK_PLATFORM_ROLES.length, next: null, previous: null, results: MOCK_PLATFORM_ROLES } as T);
        }

        // ACCESS GRANTS
        if (url === '/access-grants/' || url.startsWith('/access-grants/')) {
          if (url.includes('/sso-redirect/')) {
            return resolve({ url: 'https://moodle.org' } as T);
          }
          if (url.includes('/revoke/')) {
            return resolve({ ...MOCK_ACCESS_GRANTS[0], status: 'revoked' } as T);
          }
          if (method === 'GET') {
            let results = [...MOCK_ACCESS_GRANTS];
            const accessType = params.get('access_type');
            if (accessType) {
              results = results.filter((g) => g.access_type === accessType);
            }
            return resolve({
              count: results.length,
              next: null,
              previous: null,
              results,
            } as T);
          }
          if (method === 'POST') {
            const body = options.body ? JSON.parse(options.body as string) : {};
            return resolve({ id: `grant-${Date.now()}`, is_currently_valid: true, status: 'active', ...body } as T);
          }
          if (method === 'DELETE') {
            return resolve({} as T);
          }
        }

        // PERMISSIONS
        if (url.startsWith('/permissions/')) {
          return resolve({ count: MOCK_PERMISSIONS.length, next: null, previous: null, results: MOCK_PERMISSIONS } as T);
        }

        // INVITATIONS
        if (url === '/invitations/' || url.startsWith('/invitations/')) {
          if (url.includes('/activate/')) {
            return resolve({ detail: 'Compte activé avec succès.' } as T);
          }
          return resolve({ count: MOCK_INVITATIONS.length, next: null, previous: null, results: MOCK_INVITATIONS } as T);
        }

        // DOCUMENTS
        if (url === '/documents/' || url.startsWith('/documents/')) {
          if (method === 'GET') {
            return resolve({
              count: MOCK_DOCUMENTS.length,
              next: null,
              previous: null,
              results: MOCK_DOCUMENTS,
            } as T);
          }
          if (method === 'POST') {
            const body = options.body ? JSON.parse(options.body as string) : {};
            return resolve({ id: `doc-${Date.now()}`, versions_count: 0, current_version: null, ...body } as T);
          }
          if (method === 'DELETE') {
            return resolve({} as T);
          }
        }
        if (url === '/document-versions/') {
          return resolve(MOCK_DOCUMENTS[0].current_version as T);
        }

        // AUDIT LOGS
        if (url.startsWith('/audit-logs/')) {
          return resolve({
            count: MOCK_AUDIT_LOGS.length,
            next: null,
            previous: null,
            results: MOCK_AUDIT_LOGS,
          } as T);
        }

        // NOTIFICATIONS
        if (url.startsWith('/notifications/')) {
          return resolve({
            count: MOCK_NOTIFICATIONS.length,
            next: null,
            previous: null,
            results: MOCK_NOTIFICATIONS,
          } as T);
        }

        // STATS
        if (url.startsWith('/stats/overview/')) {
          return resolve(MOCK_STATS_OVERVIEW as T);
        }

        // AI ASSISTANT
        if (url.startsWith('/ai/sessions/')) {
          if (url.includes('/clear/')) {
            return resolve({
              id: 'sess-mock-1',
              title: 'Discussion avec Assistant IA',
              is_active: true,
              messages: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as T);
          }
          if (method === 'DELETE') {
            return resolve({ detail: 'Session supprimée' } as T);
          }
          if (url === '/ai/sessions/') {
            return resolve({
              count: 1,
              next: null,
              previous: null,
              results: [
                {
                  id: 'sess-mock-1',
                  title: 'Aide sur le module Economat',
                  is_active: true,
                  messages_count: 2,
                  last_message_preview: 'Comment configurer un article ?',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              ],
            } as T);
          }
          return resolve({
            id: 'sess-mock-1',
            title: 'Aide sur le module Economat',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            messages: [
              {
                id: 'msg-mock-1',
                role: 'user',
                content: 'Comment configurer un article ?',
                created_at: new Date().toISOString(),
              },
              {
                id: 'msg-mock-2',
                role: 'assistant',
                content:
                  "Pour configurer un article dans Economat, rendez-vous dans le menu 'Articles', cliquez sur 'Nouveau' et renseignez le code, la désignation et le prix unitaire.",
                sources: [{ document_title: 'Guide Utilisateur Economat', page: 12 }],
                intent: 'rag',
                created_at: new Date().toISOString(),
              },
            ],
          } as T);
        }
        if (url === '/ai/chat/') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let bodyObj: any = {};
          try {
            if (options.body) bodyObj = JSON.parse(String(options.body));
          } catch {
            // ignore
          }
          return resolve({
            session_id: bodyObj.session_id || 'sess-mock-1',
            session_title: 'Discussion avec Assistant IA',
            answer: `Bonjour ! Concernant votre demande « ${bodyObj.message || '...' } », vous pouvez effectuer cette action directement depuis l'interface ou consulter la documentation dédiée dans l'onglet Documents.`,
            sources: [{ document_title: 'Guide de démarrage ENT', page: 1 }],
            suggested_questions: ['Comment inviter un utilisateur ?', 'Comment révoquer un accès ?'],
            intent: 'rag',
            processing_time_ms: 120,
            cached: false,
          } as T);
        }
        if (url === '/ai/stats/') {
          return resolve({
            total_sessions: 42,
            total_messages: 185,
            refusal_rate_pct: 2.5,
            avg_processing_time_ms: 350,
            top_platforms: [
              { platform: 'Economat', count: 85 },
              { platform: 'Facturation', count: 60 },
            ],
            unanswered_questions_sample: ['Comment connecter une imprimante thermique ?'],
          } as T);
        }

        // Fallback
        return resolve({} as T);
      }, 30);
    });
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<T> {
    if (localStorage.getItem('ent_mock_mode') === 'true') {
      return this.handleMockRequest<T>(endpoint, options);
    }
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers, cache: 'no-store' });
    } catch {
      throw new NetworkError();
    }

    if (response.status === 401) {
      if (!isRetry) {
        const refreshed = await this.tryRefresh();
        if (refreshed) return this.request<T>(endpoint, options, true);
      }
      this.handleUnauthorized();
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    if (!response.ok) {
      throw new Error(await this.getErrorMessage(response));
    }

    const text = await response.text();
    if (!text) return {} as T;
    try {
      return JSON.parse(text);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return text as unknown as T;
    }
  }

  public get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  public post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) });
  }

  public put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  }

  public patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) });
  }

  public delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  public async requestFormData<T>(endpoint: string, method: string, formData: FormData, isRetry = false): Promise<T> {
    if (localStorage.getItem('ent_mock_mode') === 'true') {
      return this.handleMockRequest<T>(endpoint, { method, body: formData });
    }
    const token = this.getToken();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, { method, headers, body: formData, cache: 'no-store' });
    } catch {
      throw new NetworkError();
    }

    if (response.status === 401) {
      if (!isRetry) {
        const refreshed = await this.tryRefresh();
        if (refreshed) return this.requestFormData<T>(endpoint, method, formData, true);
      }
      this.handleUnauthorized();
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }
    if (!response.ok) throw new Error(await this.getErrorMessage(response));
    return response.json();
  }

  public postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.requestFormData<T>(endpoint, 'POST', formData);
  }

  public patchFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.requestFormData<T>(endpoint, 'PATCH', formData);
  }

  public getToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  public getIdToken(): string | null {
    return localStorage.getItem(ID_TOKEN_KEY);
  }

  public setTokens(accessToken: string, refreshToken?: string, idToken?: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (idToken) localStorage.setItem(ID_TOKEN_KEY, idToken);
    this.scheduleExpiry(accessToken);
  }

  public clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ID_TOKEN_KEY);
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }
}

export const apiService = new ApiService();
