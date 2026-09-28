import type { Module, Platform, PlatformRole } from '../models/Platform.model';
import type { Paginated } from './types';
import { apiService } from './api.service';

export const platformService = {
  list: (params = '') => apiService.get<Paginated<Platform>>(`/platforms/${params ? (params.startsWith('?') ? params : `?${params}`) : ''}`),
  get: (id: string) => apiService.get<Platform>(`/platforms/${id}/`),
  create: (data: Partial<Platform>) => apiService.post<Platform>('/platforms/', data),
  update: (id: string, data: Partial<Platform>) => apiService.patch<Platform>(`/platforms/${id}/`, data),
  replace: (id: string, data: Partial<Platform>) => apiService.put<Platform>(`/platforms/${id}/`, data),
  remove: (id: string) => apiService.delete(`/platforms/${id}/`),
  ssoRedirect: (id: string) => apiService.get<{ url: string }>(`/platforms/${id}/sso-redirect/`),
  modules: (id: string) => apiService.get<Paginated<Module>>(`/modules/?platform=${id}`),
  roles: (id: string) => apiService.get<Paginated<PlatformRole>>(`/platform-roles/?platform=${id}`),
};

export const moduleService = {
  list: (platformId?: string, params = '') => {
    const q = platformId ? `platform=${platformId}${params ? `&${params}` : ''}` : params;
    return apiService.get<Paginated<Module>>(`/modules/${q ? `?${q}` : ''}`);
  },
  get: (id: string) => apiService.get<Module>(`/modules/${id}/`),
  create: (data: Partial<Module>) => apiService.post<Module>('/modules/', data),
  update: (id: string, data: Partial<Module>) => apiService.patch<Module>(`/modules/${id}/`, data),
  replace: (id: string, data: Partial<Module>) => apiService.put<Module>(`/modules/${id}/`, data),
  remove: (id: string) => apiService.delete(`/modules/${id}/`),
};

export const platformRoleService = {
  list: (platformId?: string, params = '') => {
    const q = platformId ? `platform=${platformId}${params ? `&${params}` : ''}` : params;
    return apiService.get<Paginated<PlatformRole>>(`/platform-roles/${q ? `?${q}` : ''}`);
  },
  get: (id: string) => apiService.get<PlatformRole>(`/platform-roles/${id}/`),
  create: (data: Partial<PlatformRole>) => apiService.post<PlatformRole>('/platform-roles/', data),
  update: (id: string, data: Partial<PlatformRole>) => apiService.patch<PlatformRole>(`/platform-roles/${id}/`, data),
  replace: (id: string, data: Partial<PlatformRole>) => apiService.put<PlatformRole>(`/platform-roles/${id}/`, data),
  remove: (id: string) => apiService.delete(`/platform-roles/${id}/`),
};
