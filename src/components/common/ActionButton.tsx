import React from 'react';
import { type LucideIcon } from 'lucide-react';

export type ActionButtonVariant = 'details' | 'edit' | 'delete' | 'power' | 'success' | 'danger' | 'info' | 'warning';

interface ActionButtonProps {
  icon: LucideIcon;
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  variant?: ActionButtonVariant;
  isActive?: boolean;
  disabled?: boolean;
  className?: string;
  iconSize?: number;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  onClick,
  title,
  variant = 'info',
  isActive,
  disabled = false,
  className = '',
  iconSize = 14
}) => {
  const getVariantClass = () => {
    if (disabled) return 'text-gray-200 cursor-not-allowed';

    switch (variant) {
      case 'details':
        return 'text-gray-400 hover:text-green-600 hover:bg-green-50';
      case 'edit':
        return 'text-gray-400 hover:text-accent hover:bg-accent-50';
      case 'delete':
        return 'text-gray-400 hover:text-red-600 hover:bg-red-50';
      case 'power': {
        if (isActive) return 'text-green-600 hover:text-green-700 hover:bg-green-50';
        return 'text-gray-400 hover:text-green-600 hover:bg-green-50';
      }
      case 'success':
        return 'text-green-600 hover:text-green-700 hover:bg-green-50';
      case 'danger':
        return 'text-red-600 hover:text-red-700 hover:bg-red-50';
      case 'info':
        return 'text-gray-400 hover:text-primary hover:bg-primary-50';
      case 'warning':
        return 'text-gray-400 hover:text-orange-500 hover:bg-orange-50';
      default:
        return 'text-gray-400 hover:text-gray-600 hover:bg-gray-50';
    }
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick(e);
      }}
      className={`
        inline-flex items-center justify-center
        w-7 h-7 rounded-lg
        transition-all duration-200
        ${getVariantClass()}
        ${className}
      `}
      title={title}
      disabled={disabled}
      type="button"
    >
      <Icon size={iconSize} strokeWidth={2.5} />
    </button>
  );
};
