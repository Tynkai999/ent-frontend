import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { invitationService } from '../services/user.service';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { APP_NAME } from '../config/env';

const ActivateAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await invitationService.activate(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'activer le compte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-t-4 border-primary rounded-2xl shadow-xl p-7 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-xs">ENT</span>
          </div>
          <p className="font-black text-gray-900 text-lg">{APP_NAME}</p>
        </div>

        {done ? (
          <div className="text-center py-4">
            <CheckCircle2 className="text-green-600 mx-auto mb-3" size={36} />
            <p className="text-gray-800 font-medium mb-1">Compte activé</p>
            <p className="text-sm text-gray-500 mb-5">Vous pouvez maintenant vous connecter.</p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark"
            >
              Aller à la connexion <ArrowRight size={15} />
            </button>
          </div>
        ) : !token ? (
          <p className="text-sm text-red-600">Lien d'activation invalide.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="text-lg font-bold text-gray-800">Activer votre compte</h1>
            <p className="text-sm text-gray-500">Choisissez votre mot de passe pour finaliser la création de votre compte.</p>

            {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required disabled={loading} minLength={8}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                <input
                  type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required disabled={loading} minLength={8}
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Activation...</> : 'Activer mon compte'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ActivateAccountPage;
