export type OrganizationType = 'client' | 'prospect' | 'partner' | 'internal';
export type OrganizationStatus = 'active' | 'suspended' | 'archived';

export interface Organization {
  id: string;
  name: string;
  code: string;
  org_type: OrganizationType;
  email: string;
  phone: string;
  address: string;
  country: string;
  logo?: string | null;
  website: string;
  status: OrganizationStatus;
  users_count?: number;
  created_at: string;
  updated_at: string;
}
