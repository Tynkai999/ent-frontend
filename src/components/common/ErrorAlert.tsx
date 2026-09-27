import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onDismiss: () => void;
  /** Disparition automatique (ms) — 5s par défaut sur toute la plateforme,
   * en plus de la croix de fermeture manuelle. */
  autoDismissMs?: number;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss, autoDismissMs = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [message, onDismiss, autoDismissMs]);

  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs mb-4">
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="flex-shrink-0 text-red-400 hover:text-red-600"
        aria-label="Fermer"
      >
        <X size={14} />
      </button>
    </div>
  );
};
