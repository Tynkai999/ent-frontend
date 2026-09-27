import type { Invitation, User } from '../models/User.model';
import type { Paginated } from './types';
import { apiService } from './api.service';

export const userService = {
  list: (params = '') => apiService.get<Paginated<User>>(`/users/${params}`),
  get: (id: string) => apiService.get<User>(`/users/${id}/`),
  create: (data: Partial<User>) => apiService.post<User>('/users/', data),
  update: (id: string, data: Partial<User>) => apiService.patch<User>(`/users/${id}/`, data),
  remove: (id: string) => apiService.delete(`/users/${id}/`),
  suspend: (id: string) => apiService.post<User>(`/users/${id}/suspend/`),
  reactivate: (id: string) => apiService.post<User>(`/users/${id}/reactivate/`),
  invite: (id: string) => apiService.post<Invitation>(`/users/${id}/invite/`),
  generateCredentials: (id: string) =>
    apiService.post<{ email: string; password: string }>(`/users/${id}/generate_credentials/`),
  sessions: (id: string) => apiService.get<Record<string, unknown>[]>(`/users/${id}/sessions/`),
  revokeSession: (id: string, sessionId?: string) =>
    apiService.delete(`/users/${id}/sessions/${sessionId ? `?session_id=${sessionId}` : ''}`),
};

export const invitationService = {
  list: (params = '') => apiService.get<Paginated<Invitation>>(`/invitations/${params}`),
  revoke: (id: string) => apiService.post<Invitation>(`/invitations/${id}/revoke/`),
  resend: (id: string) => apiService.post<Invitation>(`/invitations/${id}/resend/`),
  activate: (token: string, password: string) =>
    apiService.post<{ detail: string }>('/invitations/activate/', { token, password }),
};
