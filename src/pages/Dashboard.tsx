import React, { useEffect, useState } from 'react';
import { AppWindow, BookOpen, Clock3, ExternalLink } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { meService } from '../services/me.service';
import { accessGrantService } from '../services/access.service';
import { platformService } from '../services/platform.service';
import { documentService } from '../services/document.service';
import type { PlatformForMe } from '../models/Platform.model';

const statusLabel: Record<string, { label: string; className: string }> = {
  active: { label: 'Actif', className: 'bg-green-50 text-green-700' },
  suspended: { label: 'Suspendu', className: 'bg-orange-50 text-orange-700' },
  expired: { label: 'Expiré', className: 'bg-red-50 text-red-700' },
  revoked: { label: 'Révoqué', className: 'bg-red-50 text-red-700' },
};

const PlatformCard: React.FC<{ platform: PlatformForMe }> = ({ platform }) => {
  const [loading, setLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const status = statusLabel[platform.status] ?? statusLabel.active;

  const handleAccess = async () => {
    // Ouvert de façon SYNCHRONE, dans le geste de clic lui-même : un
    // navigateur n'autorise `window.open` sans blocage de popup que s'il
    // est appelé directement depuis le gestionnaire d'événement, pas après
    // un `await` (l'appel réseau ci-dessous rompt ce lien à ses yeux). Pas
    // de `noopener` ici : avec cette option, la référence retournée est
    // toujours `null` (comportement standard des navigateurs), donc
    // impossible de naviguer cet onglet une fois l'URL connue — on coupe
    // `opener` nous-mêmes juste avant, ce qui offre la même protection.
    const targetTab = window.open('', '_blank');
    setLoading(true);
    try {
      // Le contrôle d'accès/validité est revérifié côté serveur avant de
      // renvoyer l'URL cible (section 16) — pas une simple redirection
      // côté client vers `platform.url`. Deux chemins : via l'Accès réel
      // de l'utilisateur, ou via la plateforme directement pour le super
      // admin (accès automatique sans Accès explicite, cf. MePlatformsView).
      const { url } = platform.access_grant_id
        ? await accessGrantService.ssoRedirect(platform.access_grant_id)
        : await platformService.ssoRedirect(platform.id);
      if (targetTab) {
        targetTab.opener = null;
        targetTab.location.href = url;
      }
    } catch (err) {
      targetTab?.close();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleManual = async () => {
    // Même raison qu'au-dessus : ouvrir la fenêtre avant l'`await`, sinon
    // le navigateur bloque silencieusement le popup ; pas de `noopener`
    // pour la même raison (sinon `targetTab` serait toujours `null`).
    const targetTab = window.open('', '_blank');
    setManualLoading(true);
    try {
      const res = await documentService.list(`?platform=${platform.id}&category=manuel&status=published`);
      const doc = res.results.find((d) => d.current_version);
      if (doc?.current_version) {
        if (targetTab) {
          targetTab.opener = null;
          targetTab.location.href = doc.current_version.file;
        }
      } else {
        targetTab?.close();
        alert('Aucun manuel n\'est disponible pour cette plateforme pour le moment.');
      }
    } catch (err) {
      targetTab?.close();
      throw err;
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-primary-50 flex items-center justify-center overflow-hidden flex-shrink-0">
            {platform.logo
              ? <img src={platform.logo} alt={platform.name} className="w-full h-full object-cover" />
              : <AppWindow size={20} className="text-primary" />}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{platform.name}</p>
            {platform.version && <p className="text-xs text-gray-400">v{platform.version}</p>}
          </div>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${status.className}`}>{status.label}</span>
      </div>

      {platform.description && <p className="text-xs text-gray-500 line-clamp-2">{platform.description}</p>}

      {platform.expires_at && (
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <Clock3 size={13} /> Expire le {new Date(platform.expires_at).toLocaleDateString('fr-FR')}
        </p>
      )}

      <div className="flex gap-2 mt-auto pt-1">
        <button
          onClick={handleAccess}
          disabled={loading}
          className="flex-1 bg-primary hover:bg-primary-dark text-white text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <ExternalLink size={13} /> Accéder
        </button>
        <button
          onClick={handleManual}
          disabled={manualLoading}
          className="px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
          title="Manuel"
        >
          <BookOpen size={14} />
        </button>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [platforms, setPlatforms] = useState<PlatformForMe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    meService.platforms()
      .then((res) => setPlatforms(res?.results || []))
      .catch((err) => {
        console.warn('Impossible de charger les plateformes:', err);
        setPlatforms([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout
      activeItem="dashboard"
      title="Tableau de bord"
      subtitle={`Bienvenue, ${user?.first_name || user?.full_name || ''}`}
    >
      <div>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Vos plateformes</h2>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Chargement...
          </div>
        ) : platforms.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center text-sm text-gray-400">
            Vous n'avez accès à aucune plateforme pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {platforms.map((platform) => (
              <PlatformCard key={platform.id} platform={platform} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
