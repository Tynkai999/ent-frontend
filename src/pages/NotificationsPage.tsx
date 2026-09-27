import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { Button } from '../components/common/Button';
import { notificationService } from '../services/audit.service';
import type { Notification } from '../models/AuditLog.model';

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    notificationService.list().then((res) => setNotifications(res.results)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <AppLayout
      activeItem="notifications"
      title="Notifications"
      subtitle="Alertes d'expiration, invitations et événements de sécurité"
      rightAction={<Button variant="secondary" icon={CheckCheck} onClick={() => notificationService.markAllRead().then(load)}>Tout marquer comme lu</Button>}
    >
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Chargement...
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-sm text-gray-400">Aucune notification.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.is_read && notificationService.markRead(n.id).then(load)}
              className={`w-full text-left flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors ${n.is_read ? 'opacity-60' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${n.is_read ? 'bg-gray-100' : 'bg-primary-50'}`}>
                <Bell size={14} className={n.is_read ? 'text-gray-400' : 'text-primary'} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800">{n.title}</p>
                {n.body && <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>}
                <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('fr-FR')}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default NotificationsPage;
