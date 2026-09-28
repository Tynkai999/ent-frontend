import type { AuditLog, Notification, StatsOverview } from '../models/AuditLog.model';
import type { Paginated } from './types';
import { apiService } from './api.service';

export const auditLogService = {
  list: (params = '') => apiService.get<Paginated<AuditLog>>(`/audit-logs/${params ? (params.startsWith('?') ? params : `?${params}`) : ''}`),
  get: (id: string) => apiService.get<AuditLog>(`/audit-logs/${id}/`),
};

export const notificationService = {
  list: (params = '') => apiService.get<Paginated<Notification>>(`/notifications/${params ? (params.startsWith('?') ? params : `?${params}`) : ''}`),
  get: (id: string) => apiService.get<Notification>(`/notifications/${id}/`),
  create: (data: Partial<Notification>) => apiService.post<Notification>('/notifications/', data),
  markRead: (id: string) => apiService.post<Notification>(`/notifications/${id}/mark_read/`),
  markAllRead: () => apiService.post<{ detail?: string }>('/notifications/mark-all-read/'),
  remove: (id: string) => apiService.delete(`/notifications/${id}/`),
};

export const statsService = {
  overview: () => apiService.get<StatsOverview>('/stats/overview/'),
};
