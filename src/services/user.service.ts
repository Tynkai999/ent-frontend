import type { Invitation, User } from '../models/User.model';
import type { Paginated } from './types';
import { apiService } from './api.service';

export interface UserSession {
  id: string;
  ip_address?: string;
  start?: string;
  last_access?: string;
  user_agent?: string;
  [key: string]: unknown;
}

export const userService = {
  list: (params = '') => apiService.get<Paginated<User>>(`/users/${params ? (params.startsWith('?') ? params : `?${params}`) : ''}`),
  get: (id: string) => apiService.get<User>(`/users/${id}/`),
  create: (data: Partial<User>) => apiService.post<User>('/users/', data),
  update: (id: string, data: Partial<User>) => apiService.patch<User>(`/users/${id}/`, data),
  replace: (id: string, data: Partial<User>) => apiService.put<User>(`/users/${id}/`, data),
  remove: (id: string) => apiService.delete(`/users/${id}/`),
  suspend: (id: string) => apiService.post<User>(`/users/${id}/suspend/`),
  reactivate: (id: string) => apiService.post<User>(`/users/${id}/reactivate/`),
  invite: (id: string) => apiService.post<Invitation>(`/users/${id}/invite/`),
  generateCredentials: (id: string) =>
    apiService.post<{ email: string; password: string }>(`/users/${id}/generate_credentials/`),
  sessions: (id: string) => apiService.get<UserSession[]>(`/users/${id}/sessions/`),
  revokeSession: (id: string, sessionId: string) =>
    apiService.delete(`/users/${id}/sessions/${sessionId}/`),
};

export const  invitationService = {
  list: (params = '') => apiService.get<Paginated<Invitation>>(`/invitations/${params ? (params.startsWith('?') ? params : `?${params}`) : ''}`),
  get: (id: string) => apiService.get<Invitation>(`/invitations/${id}/`),
  create: (data: { email: string; organization: string; role: string }) =>
    apiService.post<Invitation>('/invitations/', data),
  resend: (id: string) => apiService.post<Invitation>(`/invitations/${id}/resend/`),
  revoke: (id: string) => apiService.post<Invitation>(`/invitations/${id}/revoke/`),
  activate: (token: string, password: string) =>
    apiService.post<{ detail: string }>('/invitations/activate/', { token, password }),
  accept: (token: string, password: string) =>
    apiService.post<{ detail: string }>('/invitations/activate/', { token, password }),
};
