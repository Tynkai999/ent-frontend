import React, { useEffect, useState } from 'react';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import { Table, type TableColumn } from '../../components/Table';
import { SearchBar } from '../../components/common/SearchBar';
import { Button } from '../../components/common/Button';
import { Field } from '../../components/common/Field';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import ConfirmationModal from '../../components/ConfirmationModal';
import { organizationService } from '../../services/organization.service';
import type { Organization, OrganizationType } from '../../models/Organization.model';

const ORG_TYPE_LABELS: Record<OrganizationType, string> = {
  client: 'Client', prospect: 'Prospect', partner: 'Partenaire', internal: 'Interne',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  suspended: 'bg-orange-50 text-orange-700',
  archived: 'bg-gray-100 text-gray-500',
};

const emptyForm = { name: '', code: '', org_type: 'client' as OrganizationType, email: '', phone: '', country: '', website: '' };

const OrganizationFormModal: React.FC<{
  organization: Organization | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ organization, onClose, onSaved }) => {
  const [form, setForm] = useState(organization ? {
    name: organization.name, code: organization.code, org_type: organization.org_type,
    email: organization.email, phone: organization.phone, country: organization.country, website: organization.website,
  } : emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (organization) await organizationService.update(organization.id, form);
      else await organizationService.create(form);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {organization ? "Modifier l'organisation" : 'Nouvelle organisation'}
          </h3>

          {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom" required className="col-span-2">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </Field>
            <Field label="Code" required>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </Field>
            <Field label="Type">
              <select value={form.org_type} onChange={(e) => setForm({ ...form, org_type: e.target.value as OrganizationType })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {Object.entries(ORG_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </Field>
            <Field label="Téléphone">
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </Field>
            <Field label="Pays">
              <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </Field>
            <Field label="Site web">
              <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </Field>
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" isLoading={loading} className="flex-1">Enregistrer</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const OrganizationsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Organization | null | 'new'>(null);
  const [toDelete, setToDelete] = useState<Organization | null>(null);

  const load = () => {
    setLoading(true);
    organizationService.list(search ? `?search=${encodeURIComponent(search)}` : '')
      .then((res) => setOrganizations(res.results))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [search]);

  const columns: TableColumn<Organization>[] = [
    { key: 'name', label: 'Organisation', render: (o) => (
      <div>
        <p className="font-medium text-gray-800">{o.name}</p>
        <p className="text-xs text-gray-400">{o.code}</p>
      </div>
    ) },
    { key: 'org_type', label: 'Type', render: (o) => ORG_TYPE_LABELS[o.org_type] },
    { key: 'email', label: 'Contact', render: (o) => <span className="text-gray-500">{o.email || '—'}</span> },
    { key: 'users_count', label: 'Utilisateurs', render: (o) => o.users_count ?? 0 },
    { key: 'status', label: 'Statut', render: (o) => (
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[o.status]}`}>{o.status}</span>
    ) },
  ];

  return (
    <AppLayout
      activeItem="organizations"
      title="Organisations"
      subtitle="Clients, prospects et partenaires ayant accès à l'ENT"
      rightAction={<Button icon={Plus} onClick={() => setEditing('new')}>Nouvelle organisation</Button>}
    >
      <div className="flex items-center justify-between gap-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher une organisation..." className="max-w-sm" />
      </div>

      <Table
        columns={columns}
        data={organizations}
        loading={loading}
        emptyMessage="Aucune organisation pour le moment."
        actions={[
          { icon: Edit2, onClick: (o) => setEditing(o), variant: 'edit', label: 'Modifier' },
          { icon: Trash2, onClick: (o) => setToDelete(o), variant: 'delete', label: 'Supprimer' },
        ]}
      />

      {editing && (
        <OrganizationFormModal
          organization={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      <ConfirmationModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={async () => { if (toDelete) { await organizationService.remove(toDelete.id); setToDelete(null); load(); } }}
        title="Supprimer cette organisation ?"
        message={`Cette action est irréversible pour "${toDelete?.name}".`}
        type="danger"
        confirmText="Supprimer"
      />
    </AppLayout>
  );
};

export default OrganizationsPage;
