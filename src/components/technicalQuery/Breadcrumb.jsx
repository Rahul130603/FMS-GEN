import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-4" aria-label="Breadcrumb">
      <Home size={14} />
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight size={14} className="text-gray-300 dark:text-slate-700" />
          {item.to ? (
            <Link to={item.to} className="hover:text-brand-700 dark:hover:text-brand-400 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-800 dark:text-gray-100 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
