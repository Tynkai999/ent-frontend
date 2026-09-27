export type PlatformEnvironment = 'production' | 'staging' | 'development';
export type PlatformStatus = 'active' | 'maintenance' | 'inactive';

export interface Module {
  id: string;
  platform: string;
  name: string;
  code: string;
  description: string;
  order: number;
}

/** Rôle propre à une plateforme (ex. client/agent/manager pour Economat) —
 * synchronisé côté ENT vers un rôle de CLIENT Keycloak (section 17). */
export interface PlatformRole {
  id: string;
  platform: string;
  code: string;
  label: string;
}

export interface Platform {
  id: string;
  name: string;
  code: string;
  description: string;
  logo?: string | null;
  url: string;
  environment: PlatformEnvironment;
  status: PlatformStatus;
  version: string;
  released_at?: string | null;
  sso_client_id?: string;
  modules: Module[];
  roles: PlatformRole[];
  active_access_grants_count?: number;
  created_at: string;
  updated_at: string;
}

/** Tel que renvoyé par /me/platforms/ — vue restreinte propre au dashboard
 * utilisateur (section 15), enrichie du statut/expiration de SON accès. */
export interface PlatformForMe {
  id: string;
  name: string;
  code: string;
  description: string;
  logo?: string | null;
  url: string;
  version: string;
  status: string;
  expires_at: string | null;
  modules: Module[];
  /** Nul pour le super admin (accès automatique à toutes les plateformes,
   * sans Accès réel) — dans ce cas, l'accès passe par
   * /platforms/{id}/sso-redirect/ plutôt que par /access-grants/. */
  access_grant_id: string | null;
}
