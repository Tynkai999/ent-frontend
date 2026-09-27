import type { Module, Platform, PlatformRole } from '../models/Platform.model';
import type { Paginated } from './types';
import { apiService } from './api.service';

export const platformService = {
  list: (params = '') => apiService.get<Paginated<Platform>>(`/platforms/${params}`),
  get: (id: string) => apiService.get<Platform>(`/platforms/${id}/`),
  create: (data: Partial<Platform>) => apiService.post<Platform>('/platforms/', data),
  update: (id: string, data: Partial<Platform>) => apiService.patch<Platform>(`/platforms/${id}/`, data),
  remove: (id: string) => apiService.delete(`/platforms/${id}/`),
  ssoRedirect: (id: string) => apiService.get<{ url: string }>(`/platforms/${id}/sso-redirect/`),
};

export const moduleService = {
  list: (platformId: string) => apiService.get<Paginated<Module>>(`/modules/?platform=${platformId}`),
  create: (data: Partial<Module>) => apiService.post<Module>('/modules/', data),
  update: (id: string, data: Partial<Module>) => apiService.patch<Module>(`/modules/${id}/`, data),
  remove: (id: string) => apiService.delete(`/modules/${id}/`),
};

export const platformRoleService = {
  list: (platformId: string) => apiService.get<Paginated<PlatformRole>>(`/platform-roles/?platform=${platformId}`),
  create: (data: Partial<PlatformRole>) => apiService.post<PlatformRole>('/platform-roles/', data),
  remove: (id: string) => apiService.delete(`/platform-roles/${id}/`),
};
