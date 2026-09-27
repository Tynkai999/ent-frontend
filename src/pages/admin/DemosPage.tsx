import React, { useEffect, useState } from 'react';
import { AlarmClock, Megaphone, XCircle } from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import { Table, type TableColumn } from '../../components/Table';
import Card from '../../components/Card';
import { accessGrantService } from '../../services/access.service';
import type { AccessGrant } from '../../models/Access.model';

const isExpiringSoon = (grant: AccessGrant) => {
  if (!grant.end_date || grant.status !== 'active') return false;
  const days = (new Date(grant.end_date).getTime() - Date.now()) / 86_400_000;
  return days >= 0 && days <= 3;
};

const DemosPage: React.FC = () => {
  const [demos, setDemos] = useState<AccessGrant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accessGrantService.list('?access_type=demo').then((res) => setDemos(res.results)).finally(() => setLoading(false));
  }, []);

  const active = demos.filter((d) => d.status === 'active');
  const expiringSoon = demos.filter(isExpiringSoon);
  const expired = demos.filter((d) => d.status === 'expired');

  const columns: TableColumn<AccessGrant>[] = [
    { key: 'user_name', label: 'Prospect', render: (g) => (
      <div><p className="font-medium text-gray-800">{g.user_name}</p><p className="text-xs text-gray-400">{g.user_email}</p></div>
    ) },
    { key: 'platform_name', label: 'Plateforme' },
    { key: 'end_date', label: 'Expire le', render: (g) => (
      g.end_date ? <span className={isExpiringSoon(g) ? 'text-orange-600 font-medium' : 'text-gray-500'}>{new Date(g.end_date).toLocaleDateString('fr-FR')}</span> : '—'
    ) },
    { key: 'status', label: 'Statut', render: (g) => (
      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">{g.status}</span>
    ) },
  ];

  return (
    <AppLayout activeItem="demos" title="Démonstrations" subtitle="Suivi commercial des accès de démonstration">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card title="Démos en cours" value={active.length} color="primary-500" bgColor="bg-primary-50" icon={Megaphone} />
        <Card title="Expirent bientôt (≤3j)" value={expiringSoon.length} color="orange-500" bgColor="bg-orange-50" icon={AlarmClock} badge={expiringSoon.length > 0 ? 'à relancer' : undefined} badgePositive={false} />
        <Card title="Expirées" value={expired.length} color="red-500" bgColor="bg-red-50" icon={XCircle} />
      </div>

      <Table columns={columns} data={demos} loading={loading} emptyMessage="Aucune démonstration en cours." />
    </AppLayout>
  );
};

export default DemosPage;
