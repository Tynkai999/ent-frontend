import React from 'react'
import { type LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  badge?: string;
  badgePositive?: boolean;
  color: string;
  bgColor: string;
  icon?: LucideIcon;
}

const Card: React.FC<StatCardProps> = ({
  title,
  value,
  badge,
  badgePositive = true,
  bgColor,
  color,
  icon: Icon,
}) => {
  return (
    <div className={`${bgColor} rounded-xl p-3 sm:p-4 flex flex-col gap-2`}>
      <div className="flex items-start justify-between">
        {Icon ? (
          <div className={`bg-${color} bg-opacity-20 rounded-lg p-2`}>
            <Icon size={16} className={`text-${color}`} />
          </div>
        ) : (
          <div />
        )}
        {badge && (
          <span
            className={`text-[10px] font-semibold ${
              badgePositive ? `text-${color}` : 'text-red-500'
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      <div>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
          {value}
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5">{title}</p>
      </div>
    </div>
  );
};

export default Card;
