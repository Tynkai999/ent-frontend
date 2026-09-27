import type { AuditLog, Notification, StatsOverview } from '../models/AuditLog.model';
import type { Paginated } from './types';
import { apiService } from './api.service';

export const auditLogService = {
  list: (params = '') => apiService.get<Paginated<AuditLog>>(`/audit-logs/${params}`),
};

export const notificationService = {
  list: (params = '') => apiService.get<Paginated<Notification>>(`/notifications/${params}`),
  markRead: (id: string) => apiService.post<Notification>(`/notifications/${id}/mark_read/`),
  markAllRead: () => apiService.post('/notifications/mark-all-read/'),
};

export const statsService = {
  overview: () => apiService.get<StatsOverview>('/stats/overview/'),
};
