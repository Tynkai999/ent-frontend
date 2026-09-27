import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface AppLayoutProps {
  activeItem: string;
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ activeItem, title, subtitle, rightAction, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        activeItem={activeItem}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
        isDesktopCollapsed={isDesktopCollapsed}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          title={title}
          subtitle={subtitle}
          onMobileMenuToggle={() => setIsMobileMenuOpen((v) => !v)}
          onDesktopMenuToggle={() => setIsDesktopCollapsed((v) => !v)}
          rightAction={rightAction}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
