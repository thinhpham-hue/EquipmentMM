import React from 'react';

export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <div className={`px-3.5 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 text-white ${toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-600' : 'bg-blue-600'}`}>
        <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}`}></i>
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}