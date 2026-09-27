import React from 'react';

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({ label, required, children, className = '' }) => (
  <div className={className}>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}{' '}
      <span className="text-gray-400 font-normal normal-case">{required ? '(obligatoire)' : '(optionnel)'}</span>
    </label>
    {children}
  </div>
);

export default Field;
