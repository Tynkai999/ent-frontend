export type PermissionAction = 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT';

export interface Permission {
  id: string;
  module: string;
  module_name: string;
  platform_name: string;
  action: PermissionAction;
}

export type AccessType = 'demo' | 'test' | 'client' | 'partner' | 'internal';
export type AccessStatus = 'active' | 'suspended' | 'expired' | 'revoked';

export interface AccessGrant {
  id: string;
  user: string;
  user_name: string;
  user_email: string;
  platform: string;
  platform_name: string;
  modules: string[];
  permission_codes?: string[];
  platform_role: string | null;
  platform_role_label?: string | null;
  access_type: AccessType;
  status: AccessStatus;
  start_date: string;
  end_date: string | null;
  is_currently_valid: boolean;
  created_by: string | null;
  created_at: string;
}
