import React from 'react';
import { Building2, Mail, Phone, ShieldCheck } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS } from '../models/User.model';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || '?';

  return (
    <AppLayout activeItem="profil" title="Mon profil" subtitle="Informations de votre compte">
      <div className="max-w-2xl bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center overflow-hidden flex-shrink-0">
            {user.photo
              ? <img src={user.photo} alt={user.full_name} className="w-full h-full object-cover" />
              : <span className="text-xl font-bold text-primary">{initials}</span>}
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{user.full_name}</p>
            <p className="text-sm text-gray-400">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-3 text-gray-700">
            <Mail size={16} className="text-gray-400" />
            {user.email}
          </div>
          {user.phone && (
            <div className="flex items-center gap-3 text-gray-700">
              <Phone size={16} className="text-gray-400" />
              {user.phone}
            </div>
          )}
          {user.organization_name && (
            <div className="flex items-center gap-3 text-gray-700">
              <Building2 size={16} className="text-gray-400" />
              {user.organization_name}
            </div>
          )}
          <div className="flex items-center gap-3 text-gray-700">
            <ShieldCheck size={16} className="text-gray-400" />
            Identité gérée par le fournisseur d'identité central (Keycloak)
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
