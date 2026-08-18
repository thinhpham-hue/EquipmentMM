import React from 'react';

export default function EquipmentPanel({
  panelState,
  togglePanel,
  inventorySearch,
  setInventorySearch,
  inventoryCategory,
  setInventoryCategory,
  filteredEquipment,
  equipmentList,
  handleDropOnPool,
  expandedEquipmentIds,
  setExpandedEquipmentIds,
  setEditingEquipment,
  setEqForm,
  setModalType,
  getProjectName
}) {
  return (
    <section className={`workspace-panel ${panelState.center ? 'w-14 min-w-[56px]' : 'flex-1 min-w-[300px]'} bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden relative shadow-2xl`}>
      {!panelState.center ? (
        <>
          <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30">
                <i className="fa-solid fa-boxes-stacked"></i>
              </div>
              <div>
                <h2 className="font-extrabold text-white text-xs uppercase tracking-wider">EQUIPMENT</h2>
              </div>
            </div>
            <div>
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder=""
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <button
              onClick={() => togglePanel('center')}
              className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 flex-shrink-0 cursor-pointer border-2 border-rose-400/40 active:scale-90 transition-all"
            >
              <i className="fa-solid fa-minus text-xs"></i>
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden p-3">
            <div className="grid grid-cols-1 gap-2 mb-3">
              <select
                value={inventoryCategory}
                onChange={(e) => setInventoryCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Tất cả danh mục thiết bị</option>
                <option value="Camera">Camera</option>
                <option value="Lens">Lens (Ống kính)</option>
                <option value="Battery">Battery (Pin)</option>
                <option value="Mic Wireless">Mic Wireless</option>
                <option value="Mic">Mic (Microphone)</option>
                <option value="Sound Recorder">Sound Recorder</option>
                <option value="Lighting">Lighting (Đèn)</option>
                <option value="Monitor">Monitor (Màn hình)</option>
                <option value="Gimbal">Gimbal & Grip</option>
                <option value="Tripod">Tripod & Slider</option>
                <option value="Dock Charge">Dock Charge</option>
                <option value="Filter">Filter & Phụ kiện</option>
              </select>
            </div>

            <div
  onDragOver={(e) => e.preventDefault()}
  onDrop={handleDropOnPool}
  className="flex-1 overflow-y-auto space-y-2.5 pr-1 transition-all"
>
  {filteredEquipment.length === 0 ? (
    <div className="text-center p-6 text-slate-500 text-sm">
      <i className="fa-solid fa-box-open text-2xl mb-2 block"></i>Không tìm thấy thiết bị
    </div>
  ) : (
    filteredEquipment.map(item => {
      const isAvail = item.status === true || item.status === 'AVAILABLE' || item.status === 'true';

      let subList = [];
      if (Array.isArray(item.subDevices)) {
        subList = item.subDevices;
      } else if (typeof item.subDevices === 'string') {
        try { subList = JSON.parse(item.subDevices); } catch (e) { subList = []; }
      }

      const hasSub = subList.length > 0;
      const isExpanded = expandedEquipmentIds.has(item.id);

      let healthCardStyle = 'border-slate-800 hover:border-slate-700 bg-slate-900';
      let healthBadge = null;

      switch (item.healthStatus) {
        case 'DAMAGED':
          healthCardStyle = 'border-rose-500/60 bg-rose-950/20';
          healthBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">Hư / Lỗi</span>;
          break;
        case 'MAINTENANCE':
          healthCardStyle = 'border-orange-500/60 bg-orange-950/20';
          healthBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">Bảo Hành</span>;
          break;
        case 'INCOMPLETE':
          healthCardStyle = 'border-yellow-500/60 bg-yellow-950/20';
          healthBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">Thiếu Phụ Kiện</span>;
          break;
        default:
          if (!isAvail) healthCardStyle = 'border-slate-800 bg-slate-900 opacity-60';
          break;
      }

      return (
        <div
          key={item.id}
          draggable={isAvail}
          onDragStart={(e) => {
            const payload = { type: 'EQUIPMENT_TO_PROJECT', itemId: item.id };
            e.dataTransfer.setData('text/plain', JSON.stringify(payload));
          }}
          className={`border ${healthCardStyle} p-3 rounded-xl transition-all`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Tên Model: text-sm (14px) font-bold */}
                <span className="font-bold text-slate-100 text-sm tracking-wide truncate">{item.name}</span>
                {healthBadge}

                {/* Badge Phụ kiện & Dự án: text-[10px] */}
                {hasSub && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {subList.length} phụ kiện
                  </span>
                )}

                {!isAvail && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                    Đang ở: {getProjectName(item.currentProject)}
                  </span>
                )}
              </div>

              {/* Mã CODE & Danh mục: text-xs (12px), tăng độ tương phản màu chữ */}
              <div className="text-xs text-slate-300 font-mono mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400">CODE:</span>
                <strong className="text-blue-400 font-bold">{item.id}</strong>
                <span className="text-slate-500">•</span>
                <span className="text-slate-200 font-semibold">{item.category}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {hasSub && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedEquipmentIds(prev => {
                      const next = new Set(prev);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      return next;
                    });
                  }}
                  title={isExpanded ? "Thu gọn phụ kiện" : "Xem thiết bị con"}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs border border-slate-700 transition-all flex items-center gap-1"
                >
                  <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                </button>
              )}

              <button
                type="button"
                onClick={() => { setEditingEquipment(item); setEqForm({ ...item, subDevices: subList }); setModalType('EQUIPMENT'); }}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs border border-slate-700 transition-all"
              >
                <i className="fa-solid fa-pen"></i>
              </button>

              {isAvail && (
                <div className="p-1.5 text-slate-500 hover:text-blue-400 cursor-grab text-sm">
                  <i className="fa-solid fa-grip-vertical"></i>
                </div>
              )}
            </div>
          </div>

          {hasSub && isExpanded && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-1.5 pl-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <i className="fa-solid fa-sitemap text-xs text-blue-400"></i>
                <span>Danh sách phụ kiện kèm theo:</span>
              </div>
              {subList.map((sub, idx) => (
                <div key={sub.id || idx} className="flex items-center justify-between text-xs bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-100 font-medium truncate">
                    {sub.name}
                  </span>
                  <span className="text-blue-400 font-mono text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-semibold">
                    {sub.id}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    })
  )}
</div>

            <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Khả dụng: <strong className="text-emerald-400 font-mono font-bold">{equipmentList.filter(i => i.status === true || i.status === 'AVAILABLE' || i.status === 'true').length}</strong> | Đang mượn: <strong className="text-rose-400 font-mono font-bold">{equipmentList.filter(i => i.status === false || i.status === 'UNAVAILABLE' || i.status === 'false').length}</strong></span>
            </div>
          </div>
        </>
      ) : (
        <div
          onClick={() => togglePanel('center')}
          className="flex-1 flex flex-col items-center justify-between p-3 my-2 mx-auto w-11 bg-slate-950 border border-slate-800 rounded-3xl cursor-pointer hover:border-blue-500/60 hover:bg-blue-950/20 transition-all group shadow-xl"
        >
          <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all flex-shrink-0 border border-blue-500/30">
            <i className="fa-solid fa-arrows-left-right text-xs"></i>
          </div>
          <div className="writing-mode-vertical text-[11px] font-extrabold text-slate-300 tracking-widest uppercase my-auto py-3 select-none group-hover:text-blue-300">
            KHO THIẾT BỊ
          </div>
          <div className="font-mono font-black text-xs text-blue-400 bg-blue-950/50 px-1.5 py-0.5 rounded-full border border-blue-800/40 flex-shrink-0">
            {equipmentList.length}
          </div>
        </div>
      )}
    </section>
  );
}