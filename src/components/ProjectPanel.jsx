import React, { useState, useRef, useEffect, useMemo } from 'react';
import { getTrailingNumber } from '../utils/Helpers';

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
  supabase,
  setSdCardList,
  setProjectList,
  showToast
}) {

  const [expandedGroupKeys, setExpandedGroupKeys] = useState(new Set());
  const [showActionMenu, setShowActionMenu] = useState(false);
  const actionMenuRef = useRef(null);

  // Lắng nghe sự kiện click ra ngoài để tự động đóng Dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setShowActionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { equipmentItems, sdGroups } = useMemo(() => {
    if (!activeProject?.items) return { equipmentItems: [], sdGroups: [] };

    const eqList = [];
    const sdMap = {};

    activeProject.items.forEach((item) => {
      const isSdCard = item.itemType === 'SD_CARD';
      const isSdPack = item.itemType === 'SD_PACK';

      if (isSdCard) {
        // Tách tiền tố mã ID (VD: MM-SD-128GB-V30-1 -> MM-SD-128GB-V30)
        const prefix = item.id.replace(/-[0-9]+$/, '');
        const key = `${prefix}_${item.status}`;

        if (!sdMap[key]) {
          sdMap[key] = {
            groupKey: key,
            prefix: prefix,
            capacity: item.capacity || (prefix.includes('128GB') ? '128GB' : prefix.includes('256GB') ? '256GB' : '32GB'),
            status: item.status,
            items: []
          };
        }
        sdMap[key].items.push(item);
      } else if (isSdPack) {
        const cards = item.cards || [];
        cards.forEach((card) => {
          const prefix = card.id.replace(/-[0-9]+$/, '');
          const key = `${prefix}_${item.status}`;
          if (!sdMap[key]) {
            sdMap[key] = {
              groupKey: key,
              prefix: prefix,
              capacity: card.capacity || (prefix.includes('128GB') ? '128GB' : prefix.includes('256GB') ? '256GB' : '32GB'),
              status: item.status,
              items: []
            };
          }
          sdMap[key].items.push({
            id: card.id,
            name: `Thẻ ${card.id}`,
            capacity: card.capacity,
            itemType: 'SD_CARD',
            status: item.status
          });
        });
      } else {
        eqList.push(item);
      }
    });

    // Sắp xếp các thẻ trong nhóm theo số đuôi ID tăng dần
    const groups = Object.values(sdMap).map((grp) => {
      grp.items.sort((a, b) => getTrailingNumber(a.id) - getTrailingNumber(b.id));
      return grp;
    });

    return { equipmentItems: eqList, sdGroups: groups };
  }, [activeProject?.items]);

  // Hàm trả toàn bộ 1 nhóm thẻ về kho
  const handleReturnSdGroup = (groupItems) => {
    if (!activeProject || !groupItems || groupItems.length === 0) return;

    const itemIds = new Set(groupItems.map((i) => i.id));

    // 1. Cập nhật trạng thái trong dự án -> RETURNED
    const updatedProjItems = activeProject.items.map((i) =>
      itemIds.has(i.id) ? { ...i, status: 'RETURNED' } : i
    );
    const updatedProj = { ...activeProject, items: updatedProjItems };

    // 2. Cập nhật State Kho Thẻ Nhớ -> AVAILABLE (status = true)
    setSdCardList((prev) =>
      prev.map((c) => (itemIds.has(c.id) ? { ...c, status: true, currentProject: null } : c))
    );

    // 3. Cập nhật State Dự Án
    setProjectList((prev) => prev.map((p) => (p.id === activeProject.id ? updatedProj : p)));

    // 4. Đồng bộ Supabase
    const upsertData = Array.from(itemIds).map((id) => ({ id, status: true, currentProject: null }));
    if (upsertData.length > 0) supabase.from('sd_cards').upsert(upsertData).then();
    supabase.from('projects').upsert([updatedProj]).then();

    showToast(`Đã trả nhóm ${groupItems.length} thẻ về kho!`, 'success');
  };

  const toggleGroupExpand = (key) => {
    setExpandedGroupKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <section className={`workspace-panel ${panelState.left ? 'w-14 min-w-[56px]' : 'flex-1 min-w-[320px]'} bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden relative shadow-2xl`}>
      {!panelState.left ? (
        <>
          {/* HEADER SECTION */}
          <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-col gap-2.5 flex-shrink-0">
            {/* HÀNG 1: TABS NĂM + NÚT "+" THÊM NĂM + NÚT THU NHỎ */}
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

            {/* HÀNG 2: TABS DỰ ÁN */}
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

          {/* CONTENT SECTION */}
          <div className="flex-1 flex flex-col overflow-hidden p-3">
            {/* BANNER THÔNG TIN DỰ ÁN & CÁC NÚT THAO TÁC */}
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
                <button
                  onClick={() => setModalType('AUTO_SD')}
                  className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  <span>Mượn Thẻ</span>
                </button>

                <button
                  onClick={handleReturnAllItems}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-600/20 transition-all"
                >
                  <i className="fa-solid fa-check-double"></i>
                  <span>Bàn Giao Tất Cả</span>
                </button>

                {/* DROPDOWN MENU CHỨA "IN PHIẾU" & "XÓA DỰ ÁN" */}
                <div className="relative" ref={actionMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowActionMenu(!showActionMenu)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all shadow-sm"
                    title="Thao tác khác"
                  >
                    <i className="fa-solid fa-ellipsis-vertical"></i>
                  </button>

                  {showActionMenu && (
                    <div className="absolute right-0 mt-1.5 w-36 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-30 text-xs overflow-hidden backdrop-blur-md">
                      <button
                        type="button"
                        onClick={() => {
                          setModalType('PRINT');
                          setShowActionMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition-all font-medium"
                      >
                        <i className="fa-solid fa-print text-blue-400 w-4"></i>
                        <span>In Phiếu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setModalType('CONFIRM_DELETE');
                          setShowActionMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 flex items-center gap-2 transition-all font-semibold border-t border-slate-800/80"
                      >
                        <i className="fa-solid fa-trash-can text-rose-400 w-4"></i>
                        <span>Xóa Dự Án</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* DANH SÁCH MÓN TRONG DỰ ÁN (ĐÃ TỰ ĐỘNG GOM NHÓM THẺ) */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropOnProject}
              className="flex-1 border-2 border-dashed border-slate-800 rounded-xl p-2.5 overflow-y-auto space-y-2.5 transition-all bg-slate-950/40 min-h-[200px]"
            >
              {(!activeProject?.items || activeProject.items.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 text-xl">
                    <i className="fa-solid fa-hand-holding-hand"></i>
                  </div>
                </div>
              ) : (
                <>
                  {/* 1. RENDER NHÓM THẺ NHỚ ĐÃ GOM */}
                  {sdGroups.map((grp) => {
                    const isBorrowed = grp.status === 'BORROWED';
                    const isExpanded = expandedGroupKeys.has(grp.groupKey);

                    const firstCard = grp.items[0];
                    const lastCard = grp.items[grp.items.length - 1];

                    const startNum = getTrailingNumber(firstCard.id);
                    const endNum = getTrailingNumber(lastCard.id);

                    const rangeLabel =
                      grp.items.length > 1
                        ? `${grp.prefix}-${startNum} ➔ ${grp.prefix}-${endNum}`
                        : firstCard.id;

                    return (
                      <div
                        key={grp.groupKey}
                        className={`bg-slate-900 border ${isBorrowed
                          ? 'border-indigo-500/40 bg-indigo-950/10'
                          : 'border-emerald-500/30 bg-emerald-500/5 opacity-80'
                          } p-3 rounded-xl flex flex-col gap-2 transition-all shadow-md`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm flex-shrink-0">
                              <i className="fa-solid fa-layer-group"></i>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="font-extrabold text-white text-xs truncate flex items-center gap-1.5">
                                <span>{grp.items.length} THẺ NHỚ</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  {grp.capacity}
                                </span>
                              </div>
                              
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {/* Nút mũi tên gập/sổ danh sách thẻ con */}
                            <button
                              type="button"
                              onClick={() => toggleGroupExpand(grp.groupKey)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs border border-slate-700 transition-all flex items-center gap-1"
                              title={isExpanded ? 'Thu gọn chi tiết' : 'Xem chi tiết danh sách thẻ'}
                            >
                              <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                            </button>

                            {isBorrowed ? (
                              <button
                                onClick={() => handleReturnSdGroup(grp.items)}
                                className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                              >
                                <i className="fa-solid fa-box-archive"></i> Trả Kho
                              </button>
                            ) : (
                              <span className="text-xs font-semibold text-emerald-400">
                                <i className="fa-solid fa-circle-check"></i> Đã Trả
                              </span>
                            )}
                          </div>
                        </div>

                        {/* HIỂN THỊ CHI TIẾT CÁC THẺ CON KHI SỔ XUỐNG */}
                        {isExpanded && (
                          <div className="mt-2 pt-2.5 border-t border-slate-800 space-y-1.5 pl-2">
                            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <i className="fa-solid fa-sd-card text-xs"></i>
                                <span>Danh sách {grp.items.length} thẻ:</span>
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                              {grp.items.map((subCard) => (
                                <div
                                  key={subCard.id}
                                  draggable={isBorrowed}
                                  onDragStart={(e) => {
                                    const payload = {
                                      type: 'PROJECT_TO_POOL',
                                      itemId: subCard.id,
                                      itemType: 'SD_CARD'
                                    };
                                    e.dataTransfer.setData('text/plain', JSON.stringify(payload));
                                  }}
                                  className={`flex items-center justify-between text-xs bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono text-indigo-300 font-bold ${isBorrowed
                                      ? 'cursor-grab active:cursor-grabbing hover:border-indigo-500/60 hover:bg-slate-900'
                                      : ''
                                    } transition-all`}
                                >
                                  <span>{subCard.id}</span>
                                  {isBorrowed && (
                                    <i className="fa-solid fa-grip-vertical text-[10px] text-slate-500"></i>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* 2. RENDER CÁC THIẾT BỊ LẺ (EQUIPMENT) */}
                  {equipmentItems.map((item) => {
                    const isBorrowed = item.status === 'BORROWED';
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
                        className={`bg-slate-900 border ${isBorrowed
                          ? 'border-amber-500/30 bg-amber-500/5 cursor-grab active:cursor-grabbing'
                          : 'border-emerald-500/30 bg-emerald-500/5 opacity-80'
                          } p-3 rounded-xl flex items-center justify-between gap-2 transition-all`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            <i className="fa-solid fa-film"></i>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                              <span>{item.name}</span>
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-blue-500/20 text-blue-300">
                                Thiết Bị
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              CODE: <strong className="text-blue-400">{item.id}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isBorrowed ? (
                            <button
                              onClick={() => returnSingleItem(item.id, item.itemType)}
                              className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                            >
                              <i className="fa-solid fa-box-archive"></i> Trả Kho
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-400">
                              <i className="fa-solid fa-circle-check"></i> Đã Trả
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* THÔNG THỐNG KÊ DƯỚI ĐÁY */}
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