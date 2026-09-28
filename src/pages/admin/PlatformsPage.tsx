import React, { useEffect, useState } from 'react';
import { Edit2, KeyRound, LayoutGrid, Plus, Trash2, X } from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import { Table, type TableColumn } from '../../components/Table';
import { SearchBar } from '../../components/common/SearchBar';
import { Button } from '../../components/common/Button';
import { Field } from '../../components/common/Field';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import ConfirmationModal from '../../components/ConfirmationModal';
import { moduleService, platformRoleService, platformService } from '../../services/platform.service';
import type { Platform, PlatformEnvironment } from '../../models/Platform.model';

const ENV_LABELS: Record<PlatformEnvironment, string> = {
  production: 'Production', staging: 'Staging', development: 'Développement',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  maintenance: 'bg-orange-50 text-orange-700',
  inactive: 'bg-gray-100 text-gray-500',
};

const emptyForm = {
  name: '', code: '', url: '', description: '', environment: 'production' as PlatformEnvironment,
  version: '', sso_client_id: '',
};

const PlatformFormModal: React.FC<{ platform: Platform | null; onClose: () => void; onSaved: () => void }> = ({
  platform, onClose, onSaved,
}) => {
  const [form, setForm] = useState(platform ? {
    name: platform.name, code: platform.code, url: platform.url, description: platform.description,
    environment: platform.environment, version: platform.version, sso_client_id: platform.sso_client_id || '',
  } : emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (platform) await platformService.update(platform.id, form);
      else await platformService.create(form);
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
          <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
          <h3 className="text-lg font-bold text-gray-900 mb-4">{platform ? 'Modifier la plateforme' : 'Nouvelle plateforme'}</h3>

          {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom" required>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </Field>
            <Field label="Code" required>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </Field>
            <Field label="URL" required className="col-span-2">
              <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </Field>
            <Field label="Description" className="col-span-2">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </Field>
            <Field label="Environnement">
              <select value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value as PlatformEnvironment })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {Object.entries(ENV_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Version">
              <input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </Field>
            <Field label="Client ID Keycloak (SSO)" className="col-span-2">
              <input value={form.sso_client_id} onChange={(e) => setForm({ ...form, sso_client_id: e.target.value })}
                placeholder="ex. economat-frontend — laisser vide si la plateforme n'est pas encore intégrée au SSO"
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

const ModulesModal: React.FC<{ platform: Platform; onClose: () => void; onChanged: () => void }> = ({
  platform, onClose, onChanged,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await moduleService.create({ platform: platform.id, name, code, order: platform.modules.length });
      setName(''); setCode('');
      onChanged();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Modules — {platform.name}</h3>
          <p className="text-xs text-gray-400 mb-4">Découpage fonctionnel de la plateforme (section 11).</p>

          <div className="space-y-2 mb-4 max-h-52 overflow-y-auto">
            {platform.modules.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucun module.</p>}
            {platform.modules.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.code}</p>
                </div>
                <button onClick={() => moduleService.remove(m.id).then(onChanged)} className="text-gray-400 hover:text-red-600">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAdd} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du module" required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              <input value={code} onChange={(e) => setCode(e.target.value.toLowerCase())} placeholder="code" required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <Button type="submit" isLoading={loading} icon={Plus} className="w-full">Ajouter</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

const PlatformRolesModal: React.FC<{ platform: Platform; onClose: () => void; onChanged: () => void }> = ({
  platform, onClose, onChanged,
}) => {
  const [label, setLabel] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await platformRoleService.create({ platform: platform.id, code, label });
      setLabel(''); setCode('');
      onChanged();
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
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Rôles — {platform.name}</h3>
          <p className="text-xs text-gray-400 mb-4">
            Rôle propre à cette plateforme (ex. client, agent, responsable), choisi lors de l'attribution d'un
            accès — synchronisé vers Keycloak comme rôle de client (section 17).
          </p>

          {!platform.sso_client_id && (
            <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mb-4">
              Aucun « Client ID Keycloak » renseigné pour cette plateforme — les rôles créés ici resteront
              propres à l'ENT tant que ce champ n'est pas renseigné (bouton Modifier).
            </p>
          )}

          {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

          <div className="space-y-2 mb-4 max-h-52 overflow-y-auto">
            {platform.roles.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucun rôle défini.</p>}
            {platform.roles.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">{r.label}</p>
                  <p className="text-xs text-gray-400">{r.code}</p>
                </div>
                <button onClick={() => platformRoleService.remove(r.id).then(onChanged)} className="text-gray-400 hover:text-red-600">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAdd} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Libellé (ex. Agent)" required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              <input value={code} onChange={(e) => setCode(e.target.value.toLowerCase())} placeholder="code (ex. agent)" required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <Button type="submit" isLoading={loading} icon={Plus} className="w-full">Ajouter</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

const PlatformsPage: React.FC = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Platform | null | 'new'>(null);
  const [managingModules, setManagingModules] = useState<Platform | null>(null);
  const [managingRoles, setManagingRoles] = useState<Platform | null>(null);
  const [toDelete, setToDelete] = useState<Platform | null>(null);

  const load = () => {
    setLoading(true);
    platformService.list(search ? `?search=${encodeURIComponent(search)}` : '')
      .then((res) => {
        setPlatforms(res.results);
        if (managingModules) {
          const updated = res.results.find((p) => p.id === managingModules.id);
          if (updated) setManagingModules(updated);
        }
        if (managingRoles) {
          const updated = res.results.find((p) => p.id === managingRoles.id);
          if (updated) setManagingRoles(updated);
        }
      })
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [search]);

  const columns: TableColumn<Platform>[] = [
    { key: 'name', label: 'Plateforme', render: (p) => (
      <div>
        <p className="font-medium text-gray-800">{p.name}</p>
        <p className="text-xs text-gray-400">{p.code} · {p.url}</p>
      </div>
    ) },
    { key: 'environment', label: 'Environnement', render: (p) => ENV_LABELS[p.environment] },
    { key: 'modules', label: 'Modules', render: (p) => p.modules.length },
    { key: 'status', label: 'Statut', render: (p) => (
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[p.status]}`}>{p.status}</span>
    ) },
  ];

  return (
    <AppLayout
      activeItem="platforms"
      title="Plateformes & modules"
      subtitle="Solutions intégrées à l'ENT"
      rightAction={<Button icon={Plus} onClick={() => setEditing('new')}>Nouvelle plateforme</Button>}
    >
      <SearchBar value={search} onChange={setSearch} placeholder="Rechercher une plateforme..." className="max-w-sm" />

      <Table
        columns={columns}
        data={platforms}
        loading={loading}
        emptyMessage="Aucune plateforme pour le moment."
        actions={[
          { icon: LayoutGrid, onClick: (p) => setManagingModules(p), variant: 'info', label: 'Gérer les modules' },
          { icon: KeyRound, onClick: (p) => setManagingRoles(p), variant: 'info', label: 'Gérer les rôles' },
          { icon: Edit2, onClick: (p) => setEditing(p), variant: 'edit', label: 'Modifier' },
          { icon: Trash2, onClick: (p) => setToDelete(p), variant: 'delete', label: 'Supprimer' },
        ]}
      />

      {editing && (
        <PlatformFormModal
          platform={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      {managingModules && (
        <ModulesModal platform={managingModules} onClose={() => setManagingModules(null)} onChanged={load} />
      )}

      {managingRoles && (
        <PlatformRolesModal platform={managingRoles} onClose={() => setManagingRoles(null)} onChanged={load} />
      )}

      <ConfirmationModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={async () => { if (toDelete) { await platformService.remove(toDelete.id); setToDelete(null); load(); } }}
        title="Supprimer cette plateforme ?"
        message={`Les accès et documents liés à "${toDelete?.name}" seront également supprimés.`}
        type="danger"
        confirmText="Supprimer"
      />
    </AppLayout>
  );
};

export default PlatformsPage;
