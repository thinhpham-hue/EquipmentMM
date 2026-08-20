import React, { useState, useRef, useEffect } from 'react';

export default function PrintModal({ modalType, setModalType, activeProject }) {
  if (modalType !== 'PRINT') return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between no-print">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <i className="fa-solid fa-print text-blue-400"></i>
            <span>Xem Trước & In Phiếu Bàn Giao</span>
          </h3>
          <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white p-1">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white text-slate-900" id="print-modal-content">
          <div className="text-center border-b pb-4 mb-4">
            <h2 className="text-xl font-extrabold uppercase tracking-wide text-slate-900">MEDIA MICE STUDIO</h2>
            <p className="text-xs text-slate-600 font-medium mt-0.5">PHIẾU BÀN GIAO THIẾT BỊ & THẺ NHỚ PRODUCTION</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <p className="mb-1"><strong>Dự án:</strong> {activeProject?.name || '--'}</p>
              <p><strong>Năm thực hiện:</strong> {activeProject?.year || '--'}</p>
            </div>
            <div>
              <p className="mb-1"><strong>Người phụ trách/Mượn:</strong> {activeProject?.borrower || '--'}</p>
              <p><strong>Ngày bàn giao:</strong> {activeProject?.handoverDate || '--'}</p>
            </div>
          </div>

          <table className="w-full border-collapse border border-slate-300 text-xs text-left mb-6">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="border border-slate-300 p-2 w-10 text-center font-bold">STT</th>
                <th className="border border-slate-300 p-2 font-bold">Mã CODE</th>
                <th className="border border-slate-300 p-2 font-bold">Tên Thiết Bị / Thẻ Nhớ</th>
                <th className="border border-slate-300 p-2 w-28 font-bold">Phân Loại</th>
                <th className="border border-slate-300 p-2 w-24 text-center font-bold">Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {(!activeProject?.items || activeProject.items.length === 0) ? (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-slate-400 italic border border-slate-300">
                    Chưa có thiết bị nào trong dự án
                  </td>
                </tr>
              ) : (
                activeProject.items.map((it, idx) => (
                  <tr key={it.id || idx} className="border-b border-slate-300">
                    <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-300 p-2 font-mono font-bold text-slate-800">{it.id}</td>
                    <td className="border border-slate-300 p-2 font-semibold">{it.name}</td>
                    <td className="border border-slate-300 p-2">
                      {it.itemType === 'SD_CARD' ? 'Thẻ Nhớ' : it.itemType === 'SD_PACK' ? 'Pack Thẻ' : 'Thiết Bị'}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-bold">
                      {it.status === 'BORROWED' ? (
                        <span className="text-amber-700">Đang mượn</span>
                      ) : (
                        <span className="text-emerald-700">Đã trả</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="grid grid-cols-2 text-center text-xs mt-8 pt-4">
            <div>
              <p className="font-bold uppercase">Người Bàn Giao</p>
              <p className="text-[10px] text-slate-500 italic mb-12">(Ký & ghi rõ họ tên)</p>
            </div>
            <div>
              <p className="font-bold uppercase">Người Nhận / Phụ Trách</p>
              <p className="text-[10px] text-slate-500 italic mb-12">(Ký & ghi rõ họ tên)</p>
              <p className="font-bold text-slate-800">{activeProject?.borrower || ''}</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-2 no-print">
          <button
            type="button"
            onClick={() => setModalType(null)}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 transition-all"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
          >
            <i className="fa-solid fa-print"></i>
            <span>In Phiếu Ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}