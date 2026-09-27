import React, { useState } from 'react';
import {
  LayoutDashboard, Building2, Users, AppWindow, KeyRound, FileText,
  ScrollText, Bell, LogOut, X, ChevronDown, ChevronRight, Megaphone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Role, User } from '../models/User.model';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  page: string;
  link: string;
}

interface MenuSection {
  category: string;
  header: string;
  icon: React.ElementType;
  collapsible: boolean;
  roles?: Role[];
  items: MenuItem[];
}

const ADMIN_ROLES: Role[] = ['super_admin', 'org_admin'];
const STAFF_ROLES: Role[] = ['super_admin', 'internal_user', 'support'];

const getMenuSections = (): MenuSection[] => [
  {
    category: 'Tableau de Bord',
    header: 'GÉNÉRAL',
    icon: LayoutDashboard,
    collapsible: false,
    items: [
      { icon: LayoutDashboard, label: 'Tableau de Bord', page: 'dashboard', link: '/dashboard' },
    ],
  },
  {
    category: 'Gestion',
    header: 'GESTION',
    icon: Users,
    collapsible: true,
    roles: ADMIN_ROLES,
    items: [
      { icon: Building2, label: 'Organisations', page: 'organizations', link: '/organizations' },
      { icon: Users, label: 'Utilisateurs', page: 'users', link: '/users' },
      { icon: KeyRound, label: 'Accès', page: 'access-grants', link: '/access-grants' },
      { icon: Megaphone, label: 'Démonstrations', page: 'demos', link: '/demos' },
    ],
  },
  {
    category: 'Plateformes',
    header: 'PLATEFORMES',
    icon: AppWindow,
    collapsible: true,
    roles: STAFF_ROLES,
    items: [
      { icon: AppWindow, label: 'Plateformes & modules', page: 'platforms', link: '/platforms' },
      { icon: FileText, label: 'Documentation', page: 'documents', link: '/documents' },
    ],
  },
  {
    category: 'Sécurité',
    header: 'AUDIT & SÉCURITÉ',
    icon: ScrollText,
    collapsible: true,
    roles: STAFF_ROLES,
    items: [
      { icon: ScrollText, label: "Journal d'audit", page: 'audit-logs', link: '/audit-logs' },
      { icon: Bell, label: 'Notifications', page: 'notifications', link: '/notifications' },
    ],
  },
];

interface SidebarProps {
  activeItem?: string;
  isMobileMenuOpen?: boolean;
  onMobileMenuClose?: () => void;
  isDesktopCollapsed?: boolean;
}

const initials = (user: User | null) =>
  user ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || '?' : '?';

const SidebarContent: React.FC<{
  activeItem: string;
  isCollapsed: boolean;
  onItemClick: (link: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}> = ({ activeItem, isCollapsed, onItemClick, currentUser, onLogout, onClose, showCloseButton }) => {
  const sections = getMenuSections().filter((s) => !s.roles || (currentUser && s.roles.includes(currentUser.role)));

  const defaultOpen = sections
    .filter((s) => s.collapsible && s.items.some((i) => i.page.toLowerCase() === activeItem.toLowerCase()))
    .map((s) => s.category);
  const [openSections, setOpenSections] = useState<string[]>(defaultOpen);
  const toggleSection = (category: string) =>
    setOpenSections((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className={`flex items-center ${isCollapsed ? 'justify-center px-3 py-4' : 'justify-between px-4 py-4'}`}>
        {isCollapsed ? (
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-xs">ENT</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-xs">ENT</span>
              </div>
              <div className="leading-tight">
                <p className="font-black text-gray-900 text-sm">ENT</p>
                <p className="text-[10px] text-gray-400">Espace Numérique de Travail</p>
              </div>
            </div>
            {showCloseButton && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors">
                <X size={20} />
              </button>
            )}
          </>
        )}
      </div>

      <div className="border-t border-gray-100 mx-3" />

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {sections.map((section) => {
          const isOpen = openSections.includes(section.category);
          const hasActiveChild = section.items.some((i) => i.page.toLowerCase() === activeItem.toLowerCase());

          return (
            <div key={section.category} className="mb-4 last:mb-0">
              {!isCollapsed && section.header && (
                <p className="text-[10px] font-bold text-[#babcbe] uppercase tracking-[0.15em] px-3 mb-2 mt-4 first:mt-1">
                  {section.header}
                </p>
              )}

              {!section.collapsible ? (
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = activeItem.toLowerCase() === item.page.toLowerCase();
                    return (
                      <button
                        key={item.page}
                        onClick={() => onItemClick(item.link)}
                        title={isCollapsed ? item.label : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 overflow-hidden ${
                          isActive ? 'bg-primary text-white shadow-[0_4px_12px_rgba(31,87,173,0.25)]' : 'text-[#4b5563] hover:bg-gray-100'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                      >
                        <item.icon size={18} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                        {!isCollapsed && <span className="truncate whitespace-nowrap">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => !isCollapsed && toggleSection(section.category)}
                    title={isCollapsed ? section.category : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 overflow-hidden ${
                      hasActiveChild && !isOpen ? 'text-primary bg-primary-50' : 'text-[#4b5563] hover:bg-gray-100'
                    } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <section.icon size={18} className={`flex-shrink-0 ${hasActiveChild && !isOpen ? 'text-primary' : 'text-gray-400'}`} />
                      {!isCollapsed && <span className="truncate whitespace-nowrap">{section.category}</span>}
                    </div>
                    {!isCollapsed && (
                      <span className="text-gray-400 transition-transform duration-200 flex-shrink-0">
                        {isOpen ? <ChevronDown size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />}
                      </span>
                    )}
                  </button>

                  {!isCollapsed && (
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="ml-5 pl-4 border-l-2 border-gray-100 mt-1 space-y-0.5">
                        {section.items.map((item) => {
                          const isActive = activeItem.toLowerCase() === item.page.toLowerCase();
                          return (
                            <button
                              key={item.page}
                              onClick={() => onItemClick(item.link)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 overflow-hidden ${
                                isActive ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <item.icon size={16} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                              <span className="truncate whitespace-nowrap">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {isCollapsed && (
                    <div className="space-y-0.5 mt-1">
                      {section.items.map((item) => {
                        const isActive = activeItem.toLowerCase() === item.page.toLowerCase();
                        return (
                          <button
                            key={item.page}
                            onClick={() => onItemClick(item.link)}
                            title={item.label}
                            className={`w-full flex items-center justify-center px-3 py-2 rounded-lg transition-all duration-150 ${
                              isActive ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-100'
                            }`}
                          >
                            <item.icon size={16} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 mt-auto">
        {!isCollapsed ? (
          <div className="px-4 py-4">
            <button
              onClick={() => onItemClick('/profil')}
              className="flex items-center gap-3 mb-3 w-full text-left hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {currentUser?.photo ? (
                  <img src={currentUser.photo} alt={currentUser.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold text-gray-600">{initials(currentUser)}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{currentUser?.full_name ?? '—'}</p>
                <p className="text-xs text-gray-400 truncate">{currentUser?.email ?? ''}</p>
              </div>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm font-medium transition-colors px-1 py-1 rounded hover:bg-red-50 w-full"
            >
              <LogOut size={16} />
              <span>Déconnexion</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              <span className="text-xs font-semibold text-gray-600">{initials(currentUser)}</span>
            </div>
            <button onClick={onLogout} title="Déconnexion" className="text-red-400 hover:text-red-600 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  activeItem = 'dashboard',
  isMobileMenuOpen = false,
  onMobileMenuClose,
  isDesktopCollapsed = false,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleMenuClick = (link: string) => {
    navigate(link);
    onMobileMenuClose?.();
  };

  const commonProps = { activeItem, onItemClick: handleMenuClick, currentUser: user, onLogout: logout };

  return (
    <>
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onMobileMenuClose} />}

      <aside className={`hidden md:block flex-shrink-0 ${isDesktopCollapsed ? 'w-16' : 'w-64'} h-screen sticky top-0 transition-all duration-300 overflow-hidden`}>
        <SidebarContent {...commonProps} isCollapsed={isDesktopCollapsed} />
      </aside>

      <aside className={`fixed top-0 left-0 h-full w-64 z-50 md:hidden transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent {...commonProps} isCollapsed={false} onClose={onMobileMenuClose} showCloseButton />
      </aside>
    </>
  );
};

export default Sidebar;
