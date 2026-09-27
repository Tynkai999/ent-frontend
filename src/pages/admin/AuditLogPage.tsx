import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import { Table, type TableColumn } from '../../components/Table';
import { SearchBar } from '../../components/common/SearchBar';
import { auditLogService } from '../../services/audit.service';
import type { AuditLog } from '../../models/AuditLog.model';

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      auditLogService.list(search ? `?search=${encodeURIComponent(search)}` : '')
        .then((res) => setLogs(res.results))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const columns: TableColumn<AuditLog>[] = [
    { key: 'created_at', label: 'Date', render: (l) => new Date(l.created_at).toLocaleString('fr-FR') },
    { key: 'actor_email', label: 'Utilisateur', render: (l) => l.actor_name || l.actor_email || 'Système' },
    { key: 'action', label: 'Action', render: (l) => <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{l.action}</code> },
    { key: 'target_type', label: 'Cible', render: (l) => l.target_type ? `${l.target_type} #${l.target_id.slice(0, 8)}` : '—' },
    { key: 'ip_address', label: 'IP', render: (l) => l.ip_address || '—' },
  ];

  return (
    <AppLayout activeItem="audit-logs" title="Journal d'audit" subtitle="Toutes les opérations sensibles de l'ENT (section 20)">
      <SearchBar value={search} onChange={setSearch} placeholder="Rechercher par action, cible..." className="max-w-sm" />
      <Table columns={columns} data={logs} loading={loading} emptyMessage="Aucune entrée dans le journal." />
    </AppLayout>
  );
};

export default AuditLogPage;
