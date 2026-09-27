import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LogIn,
  Server,
  UserCheck,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Lock,
  User,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { authService } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME } from '../config/env';
import type { Role } from '../models/User.model';

const DEMO_ROLES: { role: Role; label: string; name: string; org: string; desc: string; badge: string; badgeColor: string }[] = [
  {
    role: 'super_admin',
    label: 'Super Administrateur',
    name: 'Thomas Dupont',
    org: 'Direction ENT',
    desc: 'Accès complet à tous les modules : Organisations, Utilisateurs, Plateformes, Documents, Audit.',
    badge: 'Accès Total',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  {
    role: 'org_admin',
    label: 'Administrateur Client',
    name: 'Sophie Martin',
    org: 'Académie de Paris',
    desc: 'Gestion des utilisateurs de son organisation, des attributions d\'accès et suivi des démos.',
    badge: 'Gestion Client',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    role: 'support',
    label: 'Support / Interne',
    name: 'Lucas Bernard',
    org: 'Direction ENT',
    desc: 'Maintenance des plateformes, consultation de la documentation technique et journaux d\'audit.',
    badge: 'Support',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  {
    role: 'client_user',
    label: 'Utilisateur Client',
    name: 'Émilie Leroy',
    org: 'Académie de Paris',
    desc: 'Consultation du tableau de bord et lancement des plateformes autorisées (Moodle, Nextcloud...).',
    badge: 'Standard',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
];

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { refresh, isAuthenticated } = useAuth();
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [connectingSSO, setConnectingSSO] = useState(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'sso' | 'demo'>('credentials');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Veuillez renseigner votre identifiant et votre mot de passe.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await authService.loginWithCredentials(username, password);
      await refresh();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la connexion.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeycloakLogin = async () => {
    setError('');
    setConnectingSSO(true);
    try {
      await authService.login('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de contacter le fournisseur d'identité Keycloak."
      );
      setConnectingSSO(false);
    }
  };

  const handleDemoLogin = async (role: Role) => {
    setError('');
    authService.loginAsMock(role);
    await refresh();
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden">
        {/* En-tête applicatif */}
        <div className="bg-primary px-6 sm:px-8 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <span className="text-white font-black text-sm tracking-wider">ENT</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{APP_NAME}</h1>
              <p className="text-xs text-blue-100">Espace Numérique de Travail</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://ent.tpe.bf/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full border border-white/15 transition-colors"
              title="Documentation Swagger de l'API"
            >
              <BookOpen size={13} />
              <span>Docs API</span>
              <ExternalLink size={11} className="opacity-70" />
            </a>
          </div>
        </div>

        {/* Barre d'état du backend */}
        <div className="bg-slate-50 px-6 py-2 border-b border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <Server size={12} className="text-emerald-600" />
            <span>Serveur Backend :</span>
            <a
              href="https://ent.tpe.bf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-mono font-medium"
            >
              ent.tpe.bf
            </a>
          </div>
          <div className="flex items-center gap-1 text-emerald-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span>En ligne</span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
              <div className="space-y-1">
                <p className="font-semibold">Erreur de connexion</p>
                <p className="text-xs text-red-600 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Onglets de mode de connexion */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => { setActiveTab('credentials'); setError(''); }}
              className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'credentials'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <KeyRound size={15} />
              <span>Identifiants (ent.tpe.bf)</span>
            </button>
            <button
              onClick={() => { setActiveTab('sso'); setError(''); }}
              className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'sso'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShieldCheck size={15} />
              <span>SSO Keycloak</span>
            </button>
            <button
              onClick={() => { setActiveTab('demo'); setError(''); }}
              className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'demo'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserCheck size={15} />
              <span>Mode Démonstration</span>
            </button>
          </div>

          {/* Onglet 1 : Connexion directe avec identifiants */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nom d'utilisateur ou Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ex: admin, jdupont@ent.tpe.bf..."
                    required
                    disabled={submitting}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={submitting}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-primary/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60"
              >
                <LogIn size={16} />
                <span>{submitting ? 'Authentification en cours...' : 'Se connecter au compte'}</span>
              </button>

              <p className="text-[11px] text-gray-400 text-center">
                Authentification directe sur le serveur Keycloak de <strong>ent.tpe.bf</strong>
              </p>
            </form>
          )}

          {/* Onglet 2 : Redirection SSO Keycloak */}
          {activeTab === 'sso' && (
            <div className="space-y-4">
              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-primary" />
                  Redirection OIDC avec PKCE
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Vous serez redirigé vers l'écran d'accueil institutionnel de Keycloak sur{' '}
                  <code className="text-primary bg-white px-1.5 py-0.5 rounded border border-blue-200">
                    https://ent.tpe.bf/auth
                  </code>
                </p>
              </div>

              <button
                onClick={handleKeycloakLogin}
                disabled={connectingSSO}
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 px-4 rounded-xl shadow-md shadow-primary/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60"
              >
                <LogIn size={18} />
                <span>{connectingSSO ? 'Redirection...' : 'Redirection SSO Keycloak'}</span>
              </button>
            </div>
          )}

          {/* Onglet 3 : Accès Rapide / Démo */}
          {activeTab === 'demo' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Testez immédiatement l'ensemble des modules sans renseigner d'identifiants :
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEMO_ROLES.map((item) => (
                  <button
                    key={item.role}
                    onClick={() => handleDemoLogin(item.role)}
                    className="group text-left p-3.5 rounded-xl border border-gray-200 hover:border-primary/50 hover:bg-primary-50/30 transition-all flex flex-col justify-between gap-2 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-gray-500 font-medium">{item.label}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">{item.desc}</p>
                    <div className="flex items-center justify-between text-[11px] text-primary font-medium pt-1 border-t border-gray-100">
                      <span className="text-gray-400 text-[10px]">{item.org}</span>
                      <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Entrer <ArrowRight size={12} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pied de page */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <span>Application ENT Frontend</span>
          <a
            href="https://ent.tpe.bf/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1 font-medium"
          >
            <span>Swagger API Docs</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
