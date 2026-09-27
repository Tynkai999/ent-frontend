import type { AccessGrant, Permission } from '../models/Access.model';
import type { Paginated } from './types';
import { apiService } from './api.service';

export const accessGrantService = {
  list: (params = '') => apiService.get<Paginated<AccessGrant>>(`/access-grants/${params}`),
  get: (id: string) => apiService.get<AccessGrant>(`/access-grants/${id}/`),
  create: (data: Partial<AccessGrant>) => apiService.post<AccessGrant>('/access-grants/', data),
  update: (id: string, data: Partial<AccessGrant>) => apiService.patch<AccessGrant>(`/access-grants/${id}/`, data),
  remove: (id: string) => apiService.delete(`/access-grants/${id}/`),
  revoke: (id: string) => apiService.post<AccessGrant>(`/access-grants/${id}/revoke/`),
  ssoRedirect: (id: string) => apiService.get<{ url: string }>(`/access-grants/${id}/sso-redirect/`),
};

export const permissionService = {
  list: (params = '') => apiService.get<Paginated<Permission>>(`/permissions/${params}`),
};
