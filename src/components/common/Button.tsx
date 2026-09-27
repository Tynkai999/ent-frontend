import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type ButtonVariant =
  | 'primary' | 'secondary' | 'danger' | 'warning' | 'success'
  | 'outline-primary' | 'outline-danger' | 'outline-warning' | 'outline-success'
  | 'ghost';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: LucideIcon;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  icon: Icon,
  isLoading,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-primary hover:bg-primary-dark text-white focus:ring-primary",
    success: "bg-green-700 hover:bg-green-800 text-white focus:ring-green-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    warning: "bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-500",
    secondary: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-gray-200",
    'outline-primary': "bg-white border border-primary text-primary hover:bg-primary-50 focus:ring-primary",
    'outline-danger': "bg-white border border-red-200 text-red-600 hover:bg-red-50 focus:ring-red-500",
    'outline-warning': "bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 focus:ring-orange-500",
    'outline-success': "bg-white border border-green-200 text-green-600 hover:bg-green-50 focus:ring-green-500",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 shadow-none focus:ring-gray-200"
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </button>
  );
};
