export interface AuditLog {
  id: string;
  actor: string | null;
  actor_name: string | null;
  actor_email: string | null;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string;
  created_at: string;
}

export interface Notification {
  id: string;
  notif_type: string;
  title: string;
  body: string;
  is_read: boolean;
  related_access_grant: string | null;
  created_at: string;
}

export interface StatsOverview {
  users_count: number;
  organizations_count: number;
  platforms_count: number;
  documents_count: number;
  active_access_grants: number;
  expired_access_grants: number;
  active_demos: number;
  expired_demos: number;
  logins_today: number;
  most_accessed_platforms: { name: string; code: string; grant_count: number }[];
}
