import React from 'react';
import { X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export type ConfirmationType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationType;
  loading?: boolean;
  children?: React.ReactNode;
  confirmDisabled?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'warning',
  loading = false,
  children,
  confirmDisabled = false,
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return { icon: XCircle, iconColor: 'text-red-600', iconBg: 'bg-red-100', confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500' };
      case 'warning':
        return { icon: AlertTriangle, iconColor: 'text-yellow-600', iconBg: 'bg-yellow-100', confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500' };
      case 'success':
        return { icon: CheckCircle, iconColor: 'text-green-600', iconBg: 'bg-green-100', confirmButton: 'bg-green-600 hover:bg-green-700 focus:ring-green-500' };
      case 'info':
        return { icon: Info, iconColor: 'text-primary', iconBg: 'bg-primary-100', confirmButton: 'bg-primary hover:bg-primary-dark focus:ring-primary' };
    }
  };

  const styles = getTypeStyles();
  const Icon = styles.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full transform transition-all">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>

          <div className="p-6">
            <div className={`mx-auto flex items-center justify-center w-12 h-12 rounded-full ${styles.iconBg} mb-4`}>
              <Icon className={styles.iconColor} size={24} />
            </div>

            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">{title}</h3>
            <p className="text-gray-600 text-center mb-6">{message}</p>

            {children && <div className="mb-6">{children}</div>}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading || confirmDisabled}
                className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles.confirmButton}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Traitement...
                  </span>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
