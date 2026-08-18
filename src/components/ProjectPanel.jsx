import React from 'react';

export default function ProjectPanel({
  panelState,
  togglePanel,
  yearsList,
  activeYear,
  setActiveYear,
  projectList,
  activeProjectId,
  setActiveProjectId,
  activeProject,
  borrowedItems,
  returnedItems,
  handleDropOnProject,
  handleReturnAllItems,
  returnSingleItem,
  setModalType,
  yearTabsRef,
  projectTabsRef,
  handleHorizontalScroll,
  setYearsList,
  supabase
}) {
  return (
    <section className={`workspace-panel ${panelState.left ? 'w-14 min-w-[56px]' : 'flex-1 min-w-[320px]'} bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden relative shadow-2xl`}>
      {!panelState.left ? (
        <>
          <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-col gap-2.5 flex-shrink-0">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <div
                ref={yearTabsRef}
                onWheel={(e) => handleHorizontalScroll(e, yearTabsRef)}
                className="flex items-center gap-1.5 overflow-x-auto scroll-smooth scrollbar-none flex-1"
              >
                {yearsList.map((yr) => {
                  const isActive = yr.toString() === activeYear.toString();
                  const countProjects = projectList.filter((p) => p.year.toString() === yr.toString()).length;
                  return (
                    <button
                      key={yr}
                      onClick={() => {
                        setActiveYear(yr.toString());
                        const prs = projectList.filter((p) => p.year.toString() === yr.toString());
                        if (prs.length > 0) setActiveProjectId(prs[0].id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 flex-shrink-0 ${isActive ? 'bg-blue-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}`}
                    >
                      <span>{yr}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-400'}`}>
                        {countProjects}
                      </span>
                    </button>
                  );
                })}

                <button
                  onClick={() => {
                    const ny = prompt("Nhập năm dự án mới:", (parseInt(activeYear) + 1).toString());
                    if (ny && ny.trim()) {
                      const formatted = ny.trim();
                      if (!yearsList.includes(formatted)) {
                        const updated = [...yearsList, formatted].sort((a, b) => Number(a) - Number(b));
                        setYearsList(updated);
                        supabase.from('settings').upsert({ id: 'years_config', years: updated }).then();
                      }
                      setActiveYear(formatted);
                    }
                  }}
                  title="Thêm năm mới"
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-950 hover:bg-slate-800 text-blue-400 border border-slate-800 flex items-center justify-center flex-shrink-0 transition-all"
                >
                  <i className="fa-solid fa-plus text-[10px]"></i>
                </button>
              </div>

              <button
                onClick={() => togglePanel('left')}
                className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 flex-shrink-0 cursor-pointer border-2 border-rose-400/40 active:scale-90 transition-all"
              >
                <i className="fa-solid fa-minus text-xs"></i>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div
                ref={projectTabsRef}
                onWheel={(e) => handleHorizontalScroll(e, projectTabsRef)}
                className="flex items-center gap-1.5 overflow-x-auto scroll-smooth py-0.5 scrollbar-none flex-1"
              >
                {projectList.filter((p) => p.year.toString() === activeYear.toString()).map((proj) => {
                  const isActive = proj.id === activeProjectId;
                  const bCount = proj.items ? proj.items.filter((i) => i.status === 'BORROWED').length : 0;
                  return (
                    <button
                      key={proj.id}
                      onClick={() => setActiveProjectId(proj.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'}`}
                    >
                      <span className="truncate max-w-[100px]">{proj.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-300'}`}>
                        {bCount}
                      </span>
                    </button>
                  );
                })}
                <button
                  onClick={() => setModalType('PROJECT')}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-950 text-blue-400 border border-slate-800 hover:bg-slate-800 transition-all flex-shrink-0"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden p-3">
            <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-white text-sm">{activeProject?.name || "Chưa chọn dự án"}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${borrowedItems.length > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : activeProject?.items?.length > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                    {borrowedItems.length > 0 ? `Đang mượn ${borrowedItems.length} món` : activeProject?.items?.length > 0 ? 'Đã Bàn Giao Hết' : 'Trống'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  Phụ trách: {activeProject?.borrower || '--'} | Bàn giao: {activeProject?.handoverDate || '--'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button onClick={() => setModalType('PRINT')} className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all">
                  <i className="fa-solid fa-print"></i> In Phiếu
                </button>
                <button onClick={handleReturnAllItems} className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-600/20 transition-all">
                  <i className="fa-solid fa-check-double"></i>
                  <span>Bàn Giao Tất Cả</span>
                </button>
                <button onClick={() => setModalType('CONFIRM_DELETE')} className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all">
                  <i className="fa-solid fa-trash-can"></i> Xóa Dự Án
                </button>
              </div>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropOnProject}
              className="flex-1 border-2 border-dashed border-slate-800 rounded-xl p-2.5 overflow-y-auto space-y-2 transition-all bg-slate-950/40 min-h-[200px]"
            >
              {(!activeProject?.items || activeProject.items.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 text-xl">
                    <i className="fa-solid fa-hand-holding-hand"></i>
                  </div>
                </div>
              ) : (
                activeProject.items.map((item) => {
                  const isBorrowed = item.status === 'BORROWED';
                  const isSD = item.itemType === 'SD_CARD';
                  return (
                    <div
                      key={item.id}
                      draggable={isBorrowed}
                      onDragStart={(e) => {
                        const payload = {
                          type: 'PROJECT_TO_POOL',
                          itemId: item.id,
                          itemType: item.itemType || 'EQUIPMENT'
                        };
                        e.dataTransfer.setData('text/plain', JSON.stringify(payload));
                      }}
                      className={`bg-slate-900 border ${isBorrowed ? 'border-amber-500/30 bg-amber-500/5 cursor-grab active:cursor-grabbing' : 'border-emerald-500/30 bg-emerald-500/5 opacity-80'} p-2.5 rounded-xl flex items-center justify-between gap-2 transition-all`}
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
                          <button onClick={() => returnSingleItem(item.id, item.itemType)} className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all">
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

            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>
                Tổng dự án: <strong className="text-white font-mono font-bold">{activeProject?.items?.length || 0}</strong> món (
                <strong className="text-amber-400 font-mono font-bold">{borrowedItems.length}</strong> đang mượn,{' '}
                <strong className="text-emerald-400 font-mono font-bold">{returnedItems.length}</strong> đã bàn giao)
              </span>
            </div>
          </div>
        </>
      ) : (
        <div
          onClick={() => togglePanel('left')}
          className="flex-1 flex flex-col items-center justify-between p-3 my-2 mx-auto w-11 bg-slate-950 border border-slate-800 rounded-3xl cursor-pointer hover:border-rose-500/60 hover:bg-rose-950/20 transition-all group shadow-xl"
        >
          <div className="w-7 h-7 rounded-full bg-rose-600/20 text-rose-400 group-hover:bg-rose-600 group-hover:text-white flex items-center justify-center transition-all flex-shrink-0 border border-rose-500/30">
            <i className="fa-solid fa-arrows-left-right text-xs"></i>
          </div>
          <div className="writing-mode-vertical text-[11px] font-extrabold text-slate-300 tracking-widest uppercase my-auto py-3 select-none group-hover:text-rose-300">
            DỰ ÁN & BÀN GIAO
          </div>
          <div className="font-mono font-black text-xs text-rose-400 bg-rose-950/50 px-1.5 py-0.5 rounded-full border border-rose-800/40 flex-shrink-0">
            {activeProject?.items?.length || 0}
          </div>
        </div>
      )}
    </section>
  );
}