import React, { useState } from 'react';

export default function ProjectDropZone({ activeProject, onDropItem, onReturnItem }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const rawData = e.dataTransfer.getData('text/plain');
    if (rawData) {
      const payload = JSON.parse(rawData);
      onDropItem(payload);
    }
  };

  const items = activeProject?.items || [];

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 border-2 border-dashed rounded-xl p-2.5 overflow-y-auto space-y-2 transition-all bg-slate-950/40 min-h-[200px] ${
        isDragOver ? 'border-blue-500 bg-blue-500/10 shadow-[inset_0_0_20px_rgba(59,130,246,0.25)]' : 'border-slate-800'
      }`}
    >
      {items.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 text-xl">
            <i className="fa-solid fa-hand-holding-hand"></i>
          </div>
          <p className="text-xs font-medium max-w-xs">
            Kéo & thả **Thiết Bị** hoặc **Thẻ Nhớ** vào đây để phân bổ cho dự án.
          </p>
        </div>
      ) : (
        items.map((item) => {
          const isBorrowed = item.status === 'BORROWED';
          const isSD = item.itemType === 'SD_CARD';

          return (
            <div
              key={item.id}
              className={`bg-slate-900 border ${
                isBorrowed ? 'border-amber-500/30 bg-amber-500/5' : 'border-emerald-500/30 bg-emerald-500/5 opacity-80'
              } p-2.5 rounded-xl flex items-center justify-between gap-2 transition-all`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className={`w-7 h-7 rounded-lg ${isSD ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'} flex items-center justify-center font-bold text-xs flex-shrink-0`}>
                  <i className={`fa-solid ${isSD ? 'fa-sd-card' : 'fa-film'}`}></i>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                    <span>{item.name}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${isSD ? 'bg-indigo-500/20 text-indigo-300' : 'bg-blue-500/20 text-blue-300'}`}>
                      {isSD ? 'Thẻ Nhớ' : 'Thiết Bị'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    CODE: <strong className="text-blue-400">{item.id}</strong> {isSD ? `| ${item.capacity}` : ''}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {isBorrowed ? (
                  <button
                    onClick={() => onReturnItem(item.id, item.itemType)}
                    className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                  >
                    <i className="fa-solid fa-box-archive"></i> Trả Kho
                  </button>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-400">
                    <i className="fa-solid fa-circle-check"></i> Đã Trả
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}