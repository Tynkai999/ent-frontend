import React, { useEffect, useState } from 'react';
import { Ban, Copy, KeyRound, Mail, MessageCircle, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import { Table, type TableColumn } from '../../components/Table';
import { SearchBar } from '../../components/common/SearchBar';
import { Button } from '../../components/common/Button';
import { Field } from '../../components/common/Field';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import ConfirmationModal from '../../components/ConfirmationModal';
import { userService } from '../../services/user.service';
import { organizationService } from '../../services/organization.service';
import { useAuth } from '../../contexts/AuthContext';
import { APP_NAME } from '../../config/env';
import { ROLE_LABELS, type Role, type User } from '../../models/User.model';
import type { Organization } from '../../models/Organization.model';

const emptyForm = { first_name: '', last_name: '', email: '', phone: '', organization: '', role: 'client_user' as Role };

const UserFormModal: React.FC<{
  organizations: Organization[];
  lockedOrganizationId?: string | null;
  lockedOrganizationName?: string | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ organizations, lockedOrganizationId, lockedOrganizationName, onClose, onSaved }) => {
  const [form, setForm] = useState({ ...emptyForm, organization: lockedOrganizationId || '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await userService.create(form);
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
          <h3 className="text-lg font-bold text-gray-900 mb-1">Nouvel utilisateur</h3>
          <p className="text-xs text-gray-400 mb-4">
            Une fois le compte créé, envoyez une invitation par email ou générez des identifiants à transmettre vous-même.
          </p>

          {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Prénom" required>
              <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </Field>
            <Field label="Nom" required>
              <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </Field>
            <Field label="Email" required className="col-span-2">
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </Field>
            <Field label="Téléphone (WhatsApp)" required className="col-span-2">
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required
                placeholder="+226 70 00 00 00"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </Field>
            <Field label="Organisation" required>
              {lockedOrganizationId ? (
                <input value={lockedOrganizationName || ''} disabled
                  className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500" />
              ) : (
                <select value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Sélectionner...</option>
                  {organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              )}
            </Field>
            <Field label="Rôle">
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" isLoading={loading} className="flex-1">Créer</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

/** Message pré-rempli, réutilisé pour le lien WhatsApp comme pour le
 * lien email — même contenu, deux canaux de remise. */
const buildCredentialsMessage = (user: User, password: string) =>
  `Bonjour ${user.first_name},\n\n` +
  `Voici vos identifiants de connexion à ${APP_NAME} :\n` +
  `Email : ${user.email}\n` +
  `Mot de passe temporaire : ${password}\n\n` +
  `Connectez-vous sur ${window.location.origin} — un changement de mot de passe vous sera demandé à la première connexion.`;

/** wa.me n'accepte que des chiffres (indicatif pays inclus, sans "+" ni
 * espaces) — un numéro mal saisi ouvrira simplement WhatsApp sans
 * destinataire présélectionné plutôt que d'échouer silencieusement. */
const phoneToWhatsAppDigits = (phone: string) => phone.replace(/\D/g, '');

const CredentialsShareModal: React.FC<{ user: User; password: string; onClose: () => void }> = ({
  user, password, onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const message = buildCredentialsMessage(user, password);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = `https://wa.me/${phoneToWhatsAppDigits(user.phone || '')}?text=${encodeURIComponent(message)}`;
  const mailUrl = `mailto:${encodeURIComponent(user.email)}?subject=${encodeURIComponent(`Vos identifiants ${APP_NAME}`)}&body=${encodeURIComponent(message)}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Identifiants générés</h3>
          <p className="text-xs text-gray-400 mb-4">
            Ce mot de passe ne sera plus jamais affiché — transmettez-le à {user.full_name} maintenant.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 space-y-1.5">
            <p className="text-xs text-gray-500">Email : <span className="font-medium text-gray-800">{user.email}</span></p>
            <p className="text-xs text-gray-500">
              Mot de passe : <code className="font-mono font-semibold text-primary tracking-wide">{password}</code>
            </p>
          </div>

          {!user.phone && (
            <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mb-4">
              Aucun numéro de téléphone renseigné pour cet utilisateur — l'envoi par WhatsApp ouvrira l'application sans destinataire présélectionné.
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 mb-2">
            <a
              href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
            <a
              href={mailUrl}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              <Mail size={16} /> Email
            </a>
          </div>

          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-700 py-2 transition-colors"
          >
            <Copy size={13} /> {copied ? 'Copié !' : 'Copier le message'}
          </button>
        </div>
      </div>
    </div>
  );
};

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [invited, setInvited] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ user: User; password: string } | null>(null);
  const [toDelete, setToDelete] = useState<User | null>(null);

  const load = () => {
    setLoading(true);
    userService.list(search ? `?search=${encodeURIComponent(search)}` : '')
      .then((res) => setUsers(res.results))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [search]);
  useEffect(() => {
    if (currentUser?.role === 'super_admin') {
      organizationService.list().then((res) => setOrganizations(res.results));
    }
  }, [currentUser]);

  const handleInvite = async (user: User) => {
    await userService.invite(user.id);
    setInvited(user.id);
    load();
    setTimeout(() => setInvited(null), 3000);
  };

  const handleGenerateCredentials = async (user: User) => {
    const { password } = await userService.generateCredentials(user.id);
    setCredentials({ user, password });
    load();
  };

  const columns: TableColumn<User>[] = [
    { key: 'full_name', label: 'Utilisateur', render: (u) => (
      <div>
        <p className="font-medium text-gray-800">{u.full_name}</p>
        <p className="text-xs text-gray-400">{u.email}</p>
      </div>
    ) },
    { key: 'organization_name', label: 'Organisation', render: (u) => u.organization_name || '—' },
    { key: 'role', label: 'Rôle', render: (u) => ROLE_LABELS[u.role] },
    { key: 'status', label: 'Statut', render: (u) => (
      u.is_suspended
        ? <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-50 text-red-700">Suspendu</span>
        : u.keycloak_sub
          ? <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700">Actif</span>
          : <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-50 text-orange-700">En attente d'activation</span>
    ) },
  ];

  return (
    <AppLayout
      activeItem="users"
      title="Utilisateurs"
      subtitle="Comptes ayant accès à l'ENT"
      rightAction={<Button icon={Plus} onClick={() => setShowForm(true)}>Nouvel utilisateur</Button>}
    >
      <div className="flex items-center justify-between gap-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un utilisateur..." className="max-w-sm" />
      </div>

      {invited && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-xs">
          Invitation envoyée.
        </div>
      )}

      <Table
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="Aucun utilisateur pour le moment."
        actions={[
          { icon: Mail, onClick: handleInvite, variant: 'info', label: "Envoyer l'invitation par email", condition: (u) => !u.keycloak_sub },
          { icon: KeyRound, onClick: handleGenerateCredentials, variant: 'edit', label: 'Générer des identifiants (WhatsApp / email)' },
          {
            icon: Ban, onClick: (u) => userService.suspend(u.id).then(load), variant: 'delete', label: 'Suspendre',
            condition: (u) => !u.is_suspended,
          },
          {
            icon: RotateCcw, onClick: (u) => userService.reactivate(u.id).then(load), variant: 'success', label: 'Réactiver',
            condition: (u) => u.is_suspended,
          },
          { icon: Trash2, onClick: (u) => setToDelete(u), variant: 'delete', label: 'Supprimer' },
        ]}
      />

      {showForm && (
        <UserFormModal
          organizations={organizations}
          lockedOrganizationId={currentUser?.role === 'org_admin' ? currentUser.organization : null}
          lockedOrganizationName={currentUser?.role === 'org_admin' ? currentUser.organization_name : null}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}

      {credentials && (
        <CredentialsShareModal
          user={credentials.user}
          password={credentials.password}
          onClose={() => setCredentials(null)}
        />
      )}

      <ConfirmationModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={async () => { if (toDelete) { await userService.remove(toDelete.id); setToDelete(null); load(); } }}
        title="Supprimer cet utilisateur ?"
        message={`Cette action est irréversible pour "${toDelete?.full_name}" — son compte ENT et ses accès seront définitivement supprimés.`}
        type="danger"
        confirmText="Supprimer"
      />
    </AppLayout>
  );
};

export default UsersPage;
