import React from 'react';

export default function SDCardCard({ card, onEdit, onDragStart }) {
  const isAvail = item.status === true;

  return (
    <div
      className={`bg-slate-900 border ${
        isAvail ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800 opacity-60'
      } p-2.5 rounded-xl transition-all`}
      draggable={isAvail}
      onDragStart={(e) => onDragStart(e, card.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-extrabold text-indigo-400 text-xs truncate">{card.id}</span>
            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {card.capacity}
            </span>
            {!isAvail && (
              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Đang ở: {card.currentProject || 'Dự án'}
              </span>
            )}
          </div>

          <div className="text-[10px] text-slate-400 mt-0.5">
            {card.note || 'Thẻ chuẩn quay Media Mice'}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(card.id)}
            title="Sửa thẻ"
            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white text-[10px]"
          >
            <i className="fa-solid fa-pen"></i>
          </button>

          {isAvail && (
            <div title="Kéo sang dự án" className="p-1 text-slate-600 hover:text-indigo-400 cursor-grab text-xs">
              <i className="fa-solid fa-grip-vertical"></i>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}