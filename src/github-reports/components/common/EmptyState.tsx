import React from 'react';
import { SearchX, FolderSearch, Plus, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  type?: 'search' | 'folder' | 'default';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  type = 'search'
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 my-4">
      <div className="p-4 bg-slate-100 text-slate-500 rounded-full mb-4">
        {type === 'search' ? (
          <SearchX size={32} />
        ) : type === 'folder' ? (
          <FolderSearch size={32} />
        ) : (
          <RotateCcw size={32} />
        )}
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      <div className="flex items-center gap-3">
        {secondaryActionText && onSecondaryAction && (
          <Button variant="secondary" size="md" onClick={onSecondaryAction}>
            {secondaryActionText}
          </Button>
        )}
        {actionText && onAction && (
          <Button variant="primary" size="md" onClick={onAction}>
            {actionText}
          </Button>
        )}
      </div>
    </div>
  );
};
