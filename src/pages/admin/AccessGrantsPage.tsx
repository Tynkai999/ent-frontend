import React, { useEffect, useState } from 'react';
import { Ban, Plus, Trash2, X } from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import { Table, type TableColumn } from '../../components/Table';
import { Button } from '../../components/common/Button';
import { Field } from '../../components/common/Field';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import ConfirmationModal from '../../components/ConfirmationModal';
import { accessGrantService } from '../../services/access.service';
import { userService } from '../../services/user.service';
import { platformService } from '../../services/platform.service';
import type { AccessGrant, AccessType } from '../../models/Access.model';
import type { User } from '../../models/User.model';
import type { Platform } from '../../models/Platform.model';

const ACCESS_TYPE_LABELS: Record<AccessType, string> = {
  demo: 'Démo', test: 'Test', client: 'Client', partner: 'Partenaire', internal: 'Interne',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  suspended: 'bg-orange-50 text-orange-700',
  expired: 'bg-gray-100 text-gray-500',
  revoked: 'bg-red-50 text-red-700',
};

const emptyForm = {
  user: '', platform: '', platform_role: '', access_type: 'client' as AccessType,
  start_date: new Date().toISOString().slice(0, 10), end_date: '', modules: [] as string[],
};

const AccessGrantFormModal: React.FC<{ users: User[]; platforms: Platform[]; onClose: () => void; onSaved: () => void }> = ({
  users, platforms, onClose, onSaved,
}) => {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedPlatform = platforms.find((p) => p.id === form.platform);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await accessGrantService.create({
        ...form,
        end_date: form.end_date || null,
        platform_role: form.platform_role || null,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (id: string) => {
    setForm((f) => ({ ...f, modules: f.modules.includes(id) ? f.modules.filter((m) => m !== id) : [...f.modules, id] }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Nouvel accès</h3>

          {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Utilisateur" required className="col-span-2">
              <select value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Sélectionner...</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
              </select>
            </Field>
            <Field label="Plateforme" required className="col-span-2">
              <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value, modules: [], platform_role: '' })} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Sélectionner...</option>
                {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>

            {selectedPlatform && selectedPlatform.roles.length > 0 && (
              <Field label="Rôle sur la plateforme" className="col-span-2">
                <select value={form.platform_role} onChange={(e) => setForm({ ...form, platform_role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Aucun rôle spécifique</option>
                  {selectedPlatform.roles.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </Field>
            )}

            {selectedPlatform && selectedPlatform.modules.length > 0 && (
              <div className="col-span-2">
                <p className="text-xs font-medium text-gray-700 mb-1">
                  Modules <span className="text-gray-400 font-normal">(optionnel — vide = toute la plateforme)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedPlatform.modules.map((m) => (
                    <button type="button" key={m.id} onClick={() => toggleModule(m.id)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                        form.modules.includes(m.id) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}>
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Field label="Type d'accès">
              <select value={form.access_type} onChange={(e) => setForm({ ...form, access_type: e.target.value as AccessType })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {Object.entries(ACCESS_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <div />
            <Field label="Date de début" required>
              <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </Field>
            <Field label="Date de fin">
              <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </Field>
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" isLoading={loading} className="flex-1">Créer l'accès</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AccessGrantsPage: React.FC = () => {
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toDelete, setToDelete] = useState<AccessGrant | null>(null);

  const load = () => {
    setLoading(true);
    accessGrantService.list().then((res) => setGrants(res.results)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    userService.list().then((res) => setUsers(res.results));
    platformService.list().then((res) => setPlatforms(res.results));
  }, []);

  const columns: TableColumn<AccessGrant>[] = [
    { key: 'user_name', label: 'Utilisateur', render: (g) => (
      <div><p className="font-medium text-gray-800">{g.user_name}</p><p className="text-xs text-gray-400">{g.user_email}</p></div>
    ) },
    { key: 'platform_name', label: 'Plateforme', render: (g) => (
      <div>
        <p>{g.platform_name}</p>
        {g.platform_role_label && <p className="text-xs text-gray-400">Rôle : {g.platform_role_label}</p>}
      </div>
    ) },
    { key: 'access_type', label: 'Type', render: (g) => ACCESS_TYPE_LABELS[g.access_type] },
    { key: 'end_date', label: 'Validité', render: (g) => (
      <span className="text-gray-500">
        {new Date(g.start_date).toLocaleDateString('fr-FR')} → {g.end_date ? new Date(g.end_date).toLocaleDateString('fr-FR') : 'illimité'}
      </span>
    ) },
    { key: 'status', label: 'Statut', render: (g) => (
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[g.status]}`}>{g.status}</span>
    ) },
  ];

  return (
    <AppLayout
      activeItem="access-grants"
      title="Accès"
      subtitle="Attributions de plateformes aux utilisateurs"
      rightAction={<Button icon={Plus} onClick={() => setShowForm(true)}>Nouvel accès</Button>}
    >
      <Table
        columns={columns}
        data={grants}
        loading={loading}
        emptyMessage="Aucun accès pour le moment."
        actions={[
          {
            icon: Ban, onClick: (g) => accessGrantService.revoke(g.id).then(load), variant: 'delete', label: 'Révoquer',
            condition: (g) => g.status === 'active',
          },
          { icon: Trash2, onClick: (g) => setToDelete(g), variant: 'delete', label: 'Supprimer' },
        ]}
      />

      {showForm && (
        <AccessGrantFormModal
          users={users}
          platforms={platforms}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}

      <ConfirmationModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={async () => { if (toDelete) { await accessGrantService.remove(toDelete.id); setToDelete(null); load(); } }}
        title="Supprimer cet accès ?"
        message={`Contrairement à la révocation, cette action efface définitivement l'accès de "${toDelete?.user_name}" à "${toDelete?.platform_name}" — y compris de l'historique.`}
        type="danger"
        confirmText="Supprimer"
      />
    </AppLayout>
  );
};

export default AccessGrantsPage;
