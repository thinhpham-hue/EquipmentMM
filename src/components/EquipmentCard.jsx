import React, { useState } from 'react';

export default function EquipmentCard({ item, onEdit, onDragStart }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isAvail = item.status === true;
  const hasSub = item.subDevices && item.subDevices.length > 0;

  // Tính toán style màu sắc dựa trên healthStatus
  let healthStyle = 'border-slate-800 hover:border-slate-700 bg-slate-900';
  let healthBadge = null;

  switch (item.healthStatus) {
    case 'DAMAGED':
      healthStyle = 'border-rose-500/60 bg-rose-950/20';
      healthBadge = (
        <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
          Hư / Lỗi
        </span>
      );
      break;
    case 'MAINTENANCE':
      healthStyle = 'border-orange-500/60 bg-orange-950/20';
      healthBadge = (
        <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
          Bảo Hành
        </span>
      );
      break;
    case 'INCOMPLETE':
      healthStyle = 'border-yellow-500/60 bg-yellow-950/20';
      healthBadge = (
        <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
          Thiếu Phụ Kiện
        </span>
      );
      break;
    default:
      if (!isAvail) healthStyle = 'border-slate-800 bg-slate-900 opacity-60';
      break;
  }

  return (
    <div
      className={`border ${healthStyle} p-2.5 rounded-xl transition-all`}
      draggable={isAvail}
      onDragStart={(e) => onDragStart(e, item.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-extrabold text-white text-xs truncate">{item.name}</span>
            {healthBadge}
            {!isAvail && (
              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Đang ở: {item.currentProject || 'Dự án'}
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            CODE: <strong className="text-blue-400">{item.id}</strong> • {item.category}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {hasSub && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded bg-slate-800 text-slate-300 text-[10px]"
            >
              <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
            </button>
          )}

          <button
            onClick={() => onEdit(item.id)}
            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white text-[10px]"
          >
            <i className="fa-solid fa-pen"></i>
          </button>

          {isAvail && (
            <div className="p-1 text-slate-600 hover:text-blue-400 cursor-grab text-xs">
              <i className="fa-solid fa-grip-vertical"></i>
            </div>
          )}
        </div>
      </div>

      {hasSub && isExpanded && (
        <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1 pl-3">
          {item.subDevices.map((sub) => (
            <div key={sub.id} className="flex items-center justify-between text-[10px] bg-slate-950 p-1 rounded border border-slate-800/50">
              <span className="text-slate-300">
                {sub.name} <strong className="text-slate-500">({sub.id})</strong>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}