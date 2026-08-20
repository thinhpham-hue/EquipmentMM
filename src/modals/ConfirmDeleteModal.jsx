import React, { useState, useRef, useEffect } from 'react';

export default function ConfirmDeleteModal({ modalType, setModalType, activeProject, handleExecuteDeleteProject }) {
  if (modalType !== 'CONFIRM_DELETE') return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-rose-400 text-base flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>Xác Nhận Xóa Dự Án</span>
          </h3>
          <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white p-1">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            Bạn có chắc chắn muốn xóa dự án <strong className="text-white">{activeProject?.name || '--'}</strong> không? Hành động này không thể hoàn tác.
          </p>
          <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg">
            <i className="fa-solid fa-circle-info mr-1"></i> Tất cả thiết bị và thẻ nhớ đang được mượn trong dự án sẽ tự động được thu hồi về kho.
          </p>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setModalType(null)}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 transition-all"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleExecuteDeleteProject}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all"
          >
            Xóa Dự Án
          </button>
        </div>
      </div>
    </div>
  );
}