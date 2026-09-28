import type { Organization } from '../models/Organization.model';
import type { Paginated } from './types';
import { apiService } from './api.service';

export const organizationService = {
  list: (params = '') => apiService.get<Paginated<Organization>>(`/organizations/${params ? (params.startsWith('?') ? params : `?${params}`) : ''}`),
  get: (id: string) => apiService.get<Organization>(`/organizations/${id}/`),
  create: (data: Partial<Organization>) => apiService.post<Organization>('/organizations/', data),
  update: (id: string, data: Partial<Organization>) => apiService.patch<Organization>(`/organizations/${id}/`, data),
  replace: (id: string, data: Partial<Organization>) => apiService.put<Organization>(`/organizations/${id}/`, data),
  remove: (id: string) => apiService.delete(`/organizations/${id}/`),
};
