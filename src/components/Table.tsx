import React from 'react';
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { ActionButton, type ActionButtonVariant } from './common/ActionButton';

export interface TableColumn<T> {
  key: string;
  label: React.ReactNode;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string | ((item: T) => string);
}

export interface TableAction<T> {
  icon: LucideIcon;
  onClick: (item: T) => void;
  variant?: ActionButtonVariant;
  isActive?: (item: T) => boolean;
  className?: string | ((item: T) => string);
  label?: string | ((item: T) => string);
  condition?: (item: T) => boolean;
  disabled?: (item: T) => boolean;
}

export interface TableProps<T> {
  title?: string;
  subtitle?: string;
  columns: TableColumn<T>[];
  data: T[];
  actions?: TableAction<T>[];
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  itemsPerPage?: number;
  loading?: boolean;
  emptyMessage?: string;
  footer?: React.ReactNode;
}

export function Table<T extends { id: string | number }>({
  title,
  subtitle,
  columns,
  data,
  actions,
  currentPage = 1,
  totalPages = 1,
  totalItems,
  onPageChange,
  onPrevious,
  onNext,
  loading = false,
  emptyMessage = 'Aucune donnée disponible',
  footer,
}: TableProps<T>) {

  const renderPaginationButtons = () => {
    const buttons: React.ReactNode[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(
          <button
            key={`page-${i}`}
            onClick={() => onPageChange?.(i)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
              i === currentPage ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {i}
          </button>
        );
      }
    } else {
      buttons.push(
        <button
          key="page-1"
          onClick={() => onPageChange?.(1)}
          className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
            1 === currentPage ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          1
        </button>
      );

      if (currentPage > 3) {
        buttons.push(<span key="dots1" className="text-gray-400 px-1 text-xs">…</span>);
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        buttons.push(
          <button
            key={`page-${i}`}
            onClick={() => onPageChange?.(i)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
              i === currentPage ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {i}
          </button>
        );
      }

      if (currentPage < totalPages - 2) {
        buttons.push(<span key="dots2" className="text-gray-400 px-1 text-xs">…</span>);
      }

      buttons.push(
        <button
          key={`page-${totalPages}`}
          onClick={() => onPageChange?.(totalPages)}
          className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
            totalPages === currentPage ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="w-full">
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <h2 className="text-sm font-semibold text-gray-800">{title}</h2>}
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {columns.map((column, colIndex) => (
                  <th
                    key={column.key ? `${column.key}-${colIndex}` : `th-${colIndex}`}
                    className={`text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 ${
                      column.className && typeof column.className === 'string' ? column.className : ''
                    }`}
                  >
                    {column.label}
                  </th>
                ))}
                {actions && actions.length > 0 && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="px-5 py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Chargement...
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="px-5 py-10 text-center text-sm text-gray-400">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr
                    key={item.id !== undefined && item.id !== null ? `${item.id}-${index}` : `row-${index}`}
                    className={`hover:bg-gray-50 transition-colors ${
                      index < data.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    {columns.map((column, colIndex) => (
                      <td
                        key={column.key ? `${column.key}-${colIndex}` : `td-${colIndex}`}
                        className={`px-5 py-3.5 text-sm text-gray-700 ${
                          typeof column.className === 'function' ? column.className(item) : column.className || ''
                        }`}
                      >
                        {column.render ? column.render(item, index) : String((item as Record<string, unknown>)[column.key] ?? '')}
                      </td>
                    ))}
                    {actions && actions.length > 0 && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {actions
                            .filter((action) => !action.condition || action.condition(item))
                            .map((action, actionIndex) => {
                              if (action.variant) {
                                return (
                                  <ActionButton
                                    key={actionIndex}
                                    icon={action.icon}
                                    onClick={() => action.onClick(item)}
                                    variant={action.variant}
                                    title={typeof action.label === 'function' ? action.label(item) : action.label}
                                    isActive={action.isActive?.(item)}
                                    disabled={action.disabled?.(item)}
                                  />
                                );
                              }

                              const Icon = action.icon;
                              const btnClass =
                                typeof action.className === 'function'
                                  ? action.className(item)
                                  : action.className ||
                                    'w-8 h-8 rounded-lg bg-primary hover:bg-primary-dark flex items-center justify-center text-white transition-colors';
                              return (
                                <button
                                  key={actionIndex}
                                  onClick={() => action.onClick(item)}
                                  className={btnClass}
                                  title={typeof action.label === 'function' ? action.label(item) : action.label}
                                  disabled={action.disabled?.(item)}
                                >
                                  <Icon size={15} />
                                </button>
                              );
                            })}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
            {footer && <tfoot>{footer}</tfoot>}
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {totalItems !== undefined ? `${totalItems} résultat${totalItems > 1 ? 's' : ''}` : `Page ${currentPage} sur ${totalPages}`}
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={onPrevious}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} />
              </button>

              {renderPaginationButtons()}

              <button
                onClick={onNext}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
