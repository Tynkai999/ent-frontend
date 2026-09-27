import React from 'react';
import { Menu, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME } from '../config/env';

interface NavbarProps {
  title?: string;
  subtitle?: string;
  onMobileMenuToggle?: () => void;
  onDesktopMenuToggle?: () => void;
  rightAction?: React.ReactNode;
}

const formatDate = (): string =>
  new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

const Navbar: React.FC<NavbarProps> = ({
  title = 'Tableau de bord',
  subtitle,
  onMobileMenuToggle,
  onDesktopMenuToggle,
  rightAction,
}) => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu size={22} />
        </button>

        <button
          onClick={onDesktopMenuToggle}
          className="hidden md:flex text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          aria-label="Réduire le menu"
        >
          <Menu size={22} />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">{title}</h1>
          <p className="text-xs text-gray-400 leading-tight">
            {subtitle ?? `Bienvenue sur votre espace de travail ${APP_NAME}${user?.first_name ? `, ${user.first_name}` : ''}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {localStorage.getItem('ent_mock_mode') === 'true' && (
          <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Mode Démo
          </span>
        )}

        <div className="hidden sm:flex items-center gap-2 bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-lg">
          <Calendar size={14} className="text-gray-500 flex-shrink-0" />
          <span className="capitalize">{formatDate()}</span>
        </div>

        {rightAction && <div>{rightAction}</div>}
      </div>
    </header>
  );
};

export default Navbar;
