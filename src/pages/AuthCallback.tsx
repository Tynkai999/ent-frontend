import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { authService } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [error, setError] = useState('');
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    authService
      .handleCallback(window.location.search)
      .then(async (redirectPath) => {
        await refresh();
        navigate(redirectPath, { replace: true });
      })
      .catch((err: Error) => setError(err.message || 'Échec de la connexion.'));
  }, [navigate, refresh]);

  if (error) {
    return (
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4 text-center">
        <AlertTriangle className="text-red-500 mb-3" size={32} />
        <p className="text-gray-700 font-medium mb-1">Connexion impossible</p>
        <p className="text-sm text-gray-500 mb-4 max-w-sm">{error}</p>
        <button
          onClick={() => navigate('/login', { replace: true })}
          className="text-sm text-primary hover:text-primary-dark font-medium"
        >
          Retour à la connexion
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center gap-3">
      <Loader2 className="animate-spin text-primary" size={28} />
      <p className="text-sm text-gray-500">Connexion en cours...</p>
    </div>
  );
};

export default AuthCallback;
