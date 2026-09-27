export type Role = 'super_admin' | 'org_admin' | 'client_user' | 'prospect' | 'internal_user' | 'support';

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super administrateur',
  org_admin: 'Administrateur client',
  client_user: 'Utilisateur client',
  prospect: 'Prospect / Démo',
  internal_user: 'Utilisateur interne',
  support: 'Support',
};

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  username?: string;
  role: Role;
  phone?: string;
  photo?: string | null;
  organization: string | null;
  organization_name: string | null;
  is_active?: boolean;
  is_suspended: boolean;
  keycloak_sub?: string | null;
  has_pending_invitation?: boolean;
  last_login?: string | null;
  date_joined?: string;
}

export interface Invitation {
  id: string;
  user: string;
  user_full_name: string;
  email: string;
  organization: string;
  organization_name: string;
  role: Role;
  invited_by: string | null;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
  created_at: string;
}
