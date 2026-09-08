import React from 'react';

export default function Toast({ message, visible }) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-5 right-5 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl z-50 transition-all duration-200 animate-bounce">
      <span>{message}</span>
    </div>
  );
}
