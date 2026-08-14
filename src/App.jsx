import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';

export default function App() {
  const [equipmentList, setEquipmentList] = useState([]);
  const [sdCardList, setSdCardList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [yearsList, setYearsList] = useState([new Date().getFullYear().toString()]);
  const [activeYear, setActiveYear] = useState(new Date().getFullYear().toString());
  const [activeProjectId, setActiveProjectId] = useState(null);

  // States lọc & tìm kiếm
  const [projectSearch, setProjectSearch] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('ALL');
  const [sdSearch, setSdSearch] = useState('');
  const [sdCapacityFilter, setSdCapacityFilter] = useState('ALL');

  // Trạng thái thu nhỏ/mở rộng 3 bảng (Left, Center, Right)
  const [panelState, setPanelState] = useState({ left: false, center: false, right: false });

  // Sub-device expanded state
  const [expandedEquipmentIds, setExpandedEquipmentIds] = useState(new Set());

  // Ref cuộn chuột ngang
  const projectTabsRef = useRef(null);
  const yearTabsRef = useRef(null);

  // Modals & Toast State
  const [modalType, setModalType] = useState(null); // 'EQUIPMENT', 'SD', 'PROJECT', 'PRINT', 'CONFIRM_DELETE'
  const [editingItem, setEditingEquipment] = useState(null);
  const [toast, setToast] = useState(null);

  // Forms
  const [eqForm, setEqForm] = useState({ id: '', category: 'Camera', name: '', healthStatus: 'GOOD', note: '', subDevices: [] });
  const [sdForm, setSdForm] = useState({ id: '', quantity: 1, speed: 'V30', capacity: '128GB', healthStatus: 'GOOD', note: '' });
  const [projForm, setProjForm] = useState({ year: activeYear, name: '', borrower: '', handoverDate: new Date().toISOString().split('T')[0] });

  // State lọc loại thẻ nhớ: 'ALL' | 'VIDEO' (true) | 'AUDIO' (false)
  const [sdTypeTab, setSdTypeTab] = useState('ALL');

  useEffect(() => {
    loadAllDataFromSupabase();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        loadAllDataFromSupabase();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadAllDataFromSupabase = async () => {
    try {
      const [eqRes, sdRes, projRes, setRes] = await Promise.all([
        supabase.from('equipment').select('*'),
        supabase.from('sd_cards').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('settings').select('*').eq('id', 'years_config').maybeSingle()
      ]);

      if (eqRes.data) setEquipmentList(eqRes.data);
      if (sdRes.data) setSdCardList(sdRes.data);
      if (projRes.data) {
        setProjectList(projRes.data);
        if (projRes.data.length > 0 && !activeProjectId) {
          setActiveProjectId(projRes.data[0].id);
        }
      }
      if (setRes.data?.years) setYearsList(setRes.data.years);
    } catch (err) {
      console.error("Supabase load error:", err);
    }
  };

  const togglePanel = (side) => {
    setPanelState(prev => ({ ...prev, [side]: !prev[side] }));
  };

  const handleHorizontalScroll = (e, ref) => {
    if (ref.current && e.deltaY !== 0) {
      e.preventDefault();
      ref.current.scrollLeft += e.deltaY;
    }
  };

  const getProjectName = (projId) => {
    if (!projId) return 'Dự án';
    const proj = projectList.find(p => p.id === projId);
    return proj ? proj.name : projId;
  };

  // FIX 1: Optimistic UI updates khi Kéo Thả VÀO Dự án (Tương thích Boolean & String)
  const handleDropOnProject = (e) => {
    e.preventDefault();
    const activeProj = projectList.find(p => p.id === activeProjectId);
    if (!activeProj) {
      showToast("Vui lòng chọn 1 dự án trước!", "error");
      return;
    }

    try {
      const rawData = e.dataTransfer.getData('text/plain');
      if (!rawData) return;
      const payload = JSON.parse(rawData);

      if (payload.type === 'EQUIPMENT_TO_PROJECT') {
        const item = equipmentList.find(i => i.id === payload.itemId);
        const isAvail = item?.status === true || item?.status === 'AVAILABLE' || item?.status === 'true';

        if (item && isAvail) {
          const updatedItem = { ...item, status: false, currentProject: activeProj.id };
          const updatedProj = {
            ...activeProj,
            items: [...(activeProj.items || []), { id: item.id, name: item.name, itemType: 'EQUIPMENT', status: 'BORROWED' }]
          };

          setEquipmentList(prev => prev.map(i => i.id === item.id ? updatedItem : i));
          setProjectList(prev => prev.map(p => p.id === activeProj.id ? updatedProj : p));

          supabase.from('equipment').upsert([updatedItem]).then();
          supabase.from('projects').upsert([updatedProj]).then();
          showToast(`Đã thêm máy ${item.name} vào dự án!`, 'success');
        }
      } else if (payload.type === 'SD_TO_PROJECT') {
        const card = sdCardList.find(c => c.id === payload.cardId);
        const isAvail = card?.status === true || card?.status === 'AVAILABLE' || card?.status === 'true';

        if (card && isAvail) {
          const updatedCard = { ...card, status: false, currentProject: activeProj.id };
          const updatedProj = {
            ...activeProj,
            items: [...(activeProj.items || []), { id: card.id, name: `Thẻ ${card.id}`, capacity: card.capacity, itemType: 'SD_CARD', status: 'BORROWED' }]
          };

          setSdCardList(prev => prev.map(c => c.id === card.id ? updatedCard : c));
          setProjectList(prev => prev.map(p => p.id === activeProj.id ? updatedProj : p));

          supabase.from('sd_cards').upsert([updatedCard]).then();
          supabase.from('projects').upsert([updatedProj]).then();
          showToast(`Đã thêm thẻ ${card.id} vào dự án!`, 'success');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReturnAllItems = async () => {
    const activeProj = projectList.find((p) => p.id === activeProjectId);
    if (!activeProj) return;

    const borrowed = activeProj.items ? activeProj.items.filter((i) => i.status === 'BORROWED') : [];
    if (borrowed.length === 0) {
      showToast("Không có thiết bị nào đang mượn!", "info");
      return;
    }

    if (!confirm(`Xác nhận bàn giao TẤT CẢ ${borrowed.length} thiết bị/thẻ nhớ về kho?`)) {
      return;
    }

    // 1. Cập nhật danh sách món trong dự án: Chuyển BORROWED -> RETURNED
    const updatedProjItems = activeProj.items.map((i) =>
      i.status === 'BORROWED' ? { ...i, status: 'RETURNED' } : i
    );
    const updatedProj = { ...activeProj, items: updatedProjItems };

    // Lấy danh sách ID của thiết bị và thẻ nhớ đang mượn
    const borrowedEqIds = new Set(borrowed.filter((i) => i.itemType !== 'SD_CARD').map((i) => i.id));
    const borrowedSdIds = new Set(borrowed.filter((i) => i.itemType === 'SD_CARD').map((i) => i.id));

    // 2. Batch cập nhật State Kho Thiết Bị
    const updatedEqList = equipmentList.map((eq) =>
      borrowedEqIds.has(eq.id) ? { ...eq, status: true, currentProject: null } : eq
    );

    // 3. Batch cập nhật State Kho Thẻ Nhớ
    const updatedSdList = sdCardList.map((sd) =>
      borrowedSdIds.has(sd.id) ? { ...sd, status: true, currentProject: null } : sd
    );

    // 4. Cập nhật State ứng dụng ngay lập tức (0ms delay)
    setEquipmentList(updatedEqList);
    setSdCardList(updatedSdList);
    setProjectList((prev) => prev.map((p) => (p.id === activeProj.id ? updatedProj : p)));

    // 5. Đồng bộ hàng loạt lên Supabase
    const eqToUpsert = updatedEqList.filter((eq) => borrowedEqIds.has(eq.id));
    const sdToUpsert = updatedSdList.filter((sd) => borrowedSdIds.has(sd.id));

    if (eqToUpsert.length > 0) supabase.from('equipment').upsert(eqToUpsert).then();
    if (sdToUpsert.length > 0) supabase.from('sd_cards').upsert(sdToUpsert).then();
    supabase.from('projects').upsert([updatedProj]).then();

    showToast(`Đã bàn giao tất cả ${borrowed.length} món về kho thành công!`, 'success');
  };

  // Hàm thực thi xóa dự án
  const handleExecuteDeleteProject = async () => {
    const activeProj = projectList.find((p) => p.id === activeProjectId);
    if (!activeProj) return;

    // 1. Thu hồi toàn bộ thiết bị / thẻ nhớ đang mượn trong dự án về kho
    if (activeProj.items && activeProj.items.length > 0) {
      for (const item of activeProj.items) {
        if (item.status === 'BORROWED') {
          if (item.itemType === 'SD_CARD') {
            setSdCardList((prev) =>
              prev.map((c) => (c.id === item.id ? { ...c, status: true, currentProject: null } : c))
            );
            supabase.from('sd_cards').upsert([{ id: item.id, status: true, currentProject: null }]).then();
          } else {
            setEquipmentList((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, status: true, currentProject: null } : i))
            );
            supabase.from('equipment').upsert([{ id: item.id, status: true, currentProject: null }]).then();
          }
        }
      }
    }

    // 2. Xóa dự án khỏi State và Supabase
    setProjectList((prev) => prev.filter((p) => p.id !== activeProjectId));
    await supabase.from('projects').delete().eq('id', activeProjectId);

    // 3. Tự động chọn sang dự án khác trong cùng năm (nếu có)
    const remainingInYear = projectList.filter(
      (p) => p.year.toString() === activeYear.toString() && p.id !== activeProjectId
    );
    if (remainingInYear.length > 0) {
      setActiveProjectId(remainingInYear[0].id);
    } else {
      setActiveProjectId(null);
    }

    setModalType(null);
    showToast(`Đã xóa dự án "${activeProj.name}" thành công!`, 'info');
  };

  const returnSingleItem = (itemId, itemType) => {
    const activeProj = projectList.find(p => p.id === activeProjectId);
    if (!activeProj) return;

    const updatedProjItems = activeProj.items.map(i => i.id === itemId ? { ...i, status: 'RETURNED' } : i);
    const updatedProj = { ...activeProj, items: updatedProjItems };

    if (itemType === 'SD_CARD') {
      const sd = sdCardList.find(c => c.id === itemId);
      if (sd) {
        const updatedSd = { ...sd, status: true, currentProject: null };
        setSdCardList(prev => prev.map(c => c.id === itemId ? updatedSd : c));
        supabase.from('sd_cards').upsert([updatedSd]).then();
      }
    } else {
      const eq = equipmentList.find(i => i.id === itemId);
      if (eq) {
        const updatedEq = { ...eq, status: true, currentProject: null };
        setEquipmentList(prev => prev.map(i => i.id === itemId ? updatedEq : i));
        supabase.from('equipment').upsert([updatedEq]).then();
      }
    }

    setProjectList(prev => prev.map(p => p.id === activeProj.id ? updatedProj : p));
    supabase.from('projects').upsert([updatedProj]).then();
    showToast("Đã bàn giao về kho!", "info");
  };

  // FIX 2: Hàm thu hồi thiết bị hoặc thẻ nhớ từ Dự án về lại Kho (Panel 2 & Panel 3)
  const handleDropOnPool = (e) => {
    e.preventDefault();
    const activeProj = projectList.find((p) => p.id === activeProjectId);
    if (!activeProj) return;

    try {
      const rawData = e.dataTransfer.getData('text/plain');
      if (!rawData) return;
      const payload = JSON.parse(rawData);

      if (payload.type === 'PROJECT_TO_POOL') {
        const itemId = payload.itemId;
        const itemType = payload.itemType;

        // 1. Xóa món này khỏi danh sách mượn của dự án
        const updatedProjItems = (activeProj.items || []).filter((i) => i.id !== itemId);
        const updatedProj = { ...activeProj, items: updatedProjItems };

        // 2. Chuyển trạng thái thiết bị / thẻ nhớ về Khả dụng (status = true)
        if (itemType === 'SD_CARD') {
          const sd = sdCardList.find((c) => c.id === itemId);
          if (sd) {
            const updatedSd = { ...sd, status: true, currentProject: null };
            setSdCardList((prev) => prev.map((c) => (c.id === itemId ? updatedSd : c)));
            supabase.from('sd_cards').upsert([updatedSd]).then();
          }
        } else {
          const eq = equipmentList.find((i) => i.id === itemId);
          if (eq) {
            const updatedEq = { ...eq, status: true, currentProject: null };
            setEquipmentList((prev) => prev.map((i) => (i.id === itemId ? updatedEq : i)));
            supabase.from('equipment').upsert([updatedEq]).then();
          }
        }

        // 3. Cập nhật State Dự án & Đồng bộ Supabase
        setProjectList((prev) => prev.map((p) => (p.id === activeProj.id ? updatedProj : p)));
        supabase.from('projects').upsert([updatedProj]).then();

        showToast("Đã thu hồi về kho thành công!", "info");
      }
    } catch (err) {
      console.error("Drop back to pool error:", err);
    }
  };

  const activeProject = projectList.find(p => p.id === activeProjectId);
  const borrowedItems = activeProject?.items ? activeProject.items.filter(i => i.status === 'BORROWED') : [];
  const returnedItems = activeProject?.items ? activeProject.items.filter(i => i.status === 'RETURNED') : [];

  const filteredEquipment = equipmentList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(inventorySearch.toLowerCase()) || item.id.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchesCat = inventoryCategory === 'ALL' || item.category === inventoryCategory;
    return matchesSearch && matchesCat;
  });

  const filteredSDCards = sdCardList.filter(card => {
    const matchesSearch = card.id.toLowerCase().includes(sdSearch.toLowerCase()) || (card.note && card.note.toLowerCase().includes(sdSearch.toLowerCase()));
    const matchesCap = sdCapacityFilter === 'ALL' || card.capacity === sdCapacityFilter;
    const isVideo = card.isVideoCard !== false;
    const matchesType = sdTypeTab === 'ALL' ? true : (sdTypeTab === 'VIDEO' ? isVideo : !isVideo);

    return matchesSearch && matchesCap && matchesType;
  });

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 antialiased overflow-hidden">
      {/* HEADER */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between flex-shrink-0 z-30 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-bold text-base flex-shrink-0">
            <i className="fa-solid fa-film"></i>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-extrabold text-slate-100 text-sm tracking-wide leading-none flex items-center gap-2">
              MEDIA MICE
            </h1>
          </div>
        </div>

        {/* Global Search */}
        <div className="flex-1 max-w-xs relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
          <input
            type="text"
            value={projectSearch}
            onChange={(e) => {
              setProjectSearch(e.target.value);
              const term = e.target.value.trim().toLowerCase();
              if (term) {
                const match = projectList.find(p => p.name.toLowerCase().includes(term) || (p.borrower && p.borrower.toLowerCase().includes(term)));
                if (match) {
                  setActiveYear(match.year.toString());
                  setActiveProjectId(match.id);
                }
              }
            }}
            placeholder="Tìm kiếm dự án..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
          />
        </div>

        {/* Right Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditingEquipment(null); setEqForm({ id: '', category: 'Camera', name: '', healthStatus: 'GOOD', note: '', subDevices: [] }); setModalType('EQUIPMENT'); }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
            <span className="hidden md:inline">+ Thêm Thiết Bị</span>
          </button>

          <button
            onClick={() => setModalType('SD')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all"
          >
            <i className="fa-solid fa-sd-card text-[10px]"></i>
            <span className="hidden md:inline">+ Thêm Thẻ Nhớ</span>
          </button>

          <button
            onClick={loadAllDataFromSupabase}
            title="Khôi phục dữ liệu mẫu Media Mice"
            className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-lg text-xs border border-slate-700 transition-all"
          >
            <i className="fa-solid fa-rotate-left"></i>
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE 3 PANELS */}
      <main className="flex-1 flex overflow-hidden p-3 gap-3 bg-slate-950 relative">
        {/* PANEL 1 (LEFT): DỰ ÁN & BÀN GIAO */}
        <section
          className={`workspace-panel ${panelState.left ? 'w-14 min-w-[56px]' : 'flex-1 min-w-[320px]'} bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden relative shadow-2xl`}
        >
          {!panelState.left ? (
            <>
              <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-col gap-2.5 flex-shrink-0">
                {/* Year Tabs */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div
                    ref={yearTabsRef}
                    onWheel={(e) => handleHorizontalScroll(e, yearTabsRef)}
                    className="flex items-center gap-1.5 overflow-x-auto scroll-smooth scrollbar-none flex-1"
                  >
                    {yearsList.map(yr => {
                      const isActive = yr.toString() === activeYear.toString();
                      const countProjects = projectList.filter(p => p.year.toString() === yr.toString()).length;
                      return (
                        <button
                          key={yr}
                          onClick={() => {
                            setActiveYear(yr.toString());
                            const prs = projectList.filter(p => p.year.toString() === yr.toString());
                            if (prs.length > 0) setActiveProjectId(prs[0].id);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 flex-shrink-0 ${isActive ? 'bg-blue-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                        >
                          <span>{yr}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-400'}`}>
                            {countProjects}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => {
                      const ny = prompt("Nhập năm dự án mới:", (parseInt(activeYear) + 1).toString());
                      if (ny && ny.trim()) {
                        const formatted = ny.trim();
                        if (!yearsList.includes(formatted)) {
                          const updated = [...yearsList, formatted].sort((a, b) => b.localeCompare(a));
                          setYearsList(updated);
                          supabase.from('settings').upsert({ id: 'years_config', years: updated }).then();
                        }
                        setActiveYear(formatted);
                      }
                    }}
                    className="text-[10px] bg-slate-950 hover:bg-slate-800 text-blue-400 font-semibold px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-1 transition-all"
                  >
                    <i className="fa-solid fa-plus text-[9px]"></i>
                    <span>Năm</span>
                  </button>
                </div>

                {/* Project Tabs & Red Button */}
                <div className="flex items-center justify-between gap-2">
                  <div
                    ref={projectTabsRef}
                    onWheel={(e) => handleHorizontalScroll(e, projectTabsRef)}
                    className="flex items-center gap-1.5 overflow-x-auto scroll-smooth py-0.5 scrollbar-none flex-1 max-w-[calc(100%-44px)]"
                  >
                    {projectList.filter(p => p.year.toString() === activeYear.toString()).map(proj => {
                      const isActive = proj.id === activeProjectId;
                      const bCount = proj.items ? proj.items.filter(i => i.status === 'BORROWED').length : 0;
                      return (
                        <button
                          key={proj.id}
                          onClick={() => setActiveProjectId(proj.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                            }`}
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
                      className="px-2 py-1.5 rounded-xl text-xs font-bold bg-slate-950 text-blue-400 border border-slate-800 hover:bg-slate-800 transition-all flex-shrink-0"
                    >
                      + Dự án
                    </button>
                  </div>

                  <button
                    onClick={() => togglePanel('left')}
                    className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 flex-shrink-0 cursor-pointer border-2 border-rose-400/40 active:scale-90 transition-all"
                  >
                    <i className="fa-solid fa-minus text-xs"></i>
                  </button>
                </div>
              </div>

              {/* Left Content */}
              <div className="flex-1 flex flex-col overflow-hidden p-3">
                <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-extrabold text-white text-sm">{activeProject?.name || "Chưa chọn dự án"}</h2>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${borrowedItems.length > 0
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : activeProject?.items?.length > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                        {borrowedItems.length > 0 ? `Đang mượn ${borrowedItems.length} món` : activeProject?.items?.length > 0 ? 'Đã Bàn Giao Hết' : 'Trống'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      Phụ trách: {activeProject?.borrower || '--'} | Bàn giao: {activeProject?.handoverDate || '--'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setModalType('PRINT')}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <i className="fa-solid fa-print"></i> In Phiếu
                    </button>
                    <button
                      onClick={handleReturnAllItems}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-600/20 transition-all"
                    >
                      <i className="fa-solid fa-check-double"></i>
                      <span>Bàn Giao Tất Cả</span>
                    </button>
                    <button
                      onClick={() => setModalType('CONFIRM_DELETE')}
                      className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <i className="fa-solid fa-trash-can"></i> Xóa Dự Án
                    </button>
                  </div>
                </div>

                {/* Drop Zone Area */}
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
                      <p className="text-xs font-medium max-w-xs">Kéo & thả **Thiết Bị** hoặc **Thẻ Nhớ** vào đây để phân bổ cho dự án.</p>
                    </div>
                  ) : (
                    activeProject.items.map((item) => {
                      const isBorrowed = item.status === 'BORROWED';
                      const isSD = item.itemType === 'SD_CARD';
                      return (
                        <div
                          key={item.id}
                          /* FIX 3: Cho phép kéo món trong dự án đi nơi khác */
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
                              <button
                                onClick={() => returnSingleItem(item.id, item.itemType)}
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

        {/* PANEL 2 (MIDDLE): KHO TOÀN BỘ THIẾT BỊ */}
        <section
          className={`workspace-panel ${panelState.center ? 'w-14 min-w-[56px]' : 'flex-1 min-w-[300px]'} bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden relative shadow-2xl`}
        >
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

                {/* FIX 4: Thêm vùng nhận Thả thiết bị thu hồi từ Dự án về lại Kho (Panel 2) */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropOnPool}
                  className="flex-1 overflow-y-auto space-y-2 pr-1 transition-all"
                >
                  {filteredEquipment.length === 0 ? (
                    <div className="text-center p-6 text-slate-500 text-xs">
                      <i className="fa-solid fa-box-open text-xl mb-1 block"></i>Không tìm thấy thiết bị
                    </div>
                  ) : (
                    filteredEquipment.map(item => {
                      const isAvail = item.status === true || item.status === 'AVAILABLE' || item.status === 'true';
                      const hasSub = item.subDevices && item.subDevices.length > 0;
                      const isExpanded = expandedEquipmentIds.has(item.id);

                      let healthCardStyle = 'border-slate-800 hover:border-slate-700 bg-slate-900';
                      let healthBadge = null;

                      switch (item.healthStatus) {
                        case 'DAMAGED':
                          healthCardStyle = 'border-rose-500/60 bg-rose-950/20';
                          healthBadge = <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">Hư / Lỗi</span>;
                          break;
                        case 'MAINTENANCE':
                          healthCardStyle = 'border-orange-500/60 bg-orange-950/20';
                          healthBadge = <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">Bảo Hành</span>;
                          break;
                        case 'INCOMPLETE':
                          healthCardStyle = 'border-yellow-500/60 bg-yellow-950/20';
                          healthBadge = <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">Thiếu Phụ Kiện</span>;
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
                          className={`border ${healthCardStyle} p-2.5 rounded-xl transition-all`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-white text-xs truncate">{item.name}</span>
                                {healthBadge}
                                {!isAvail && (
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                    {/* Tra cứu tên từ ID */}
                                    Đang ở: {getProjectName(item.currentProject)}
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
                                  onClick={() => {
                                    setExpandedEquipmentIds(prev => {
                                      const next = new Set(prev);
                                      if (next.has(item.id)) next.delete(item.id);
                                      else next.add(item.id);
                                      return next;
                                    });
                                  }}
                                  className="p-1 rounded bg-slate-800 text-slate-300 text-[10px]"
                                >
                                  <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                                </button>
                              )}
                              <button
                                onClick={() => { setEditingEquipment(item); setEqForm({ ...item, subDevices: item.subDevices || [] }); setModalType('EQUIPMENT'); }}
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
                              {item.subDevices.map((sub, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[10px] bg-slate-950 p-1 rounded border border-slate-800/50">
                                  <span className="text-slate-300">{sub.name} <strong className="text-slate-500">({sub.id})</strong></span>
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

        {/* PANEL 3 (RIGHT): DANH SÁCH THẺ NHỚ */}
        <section className={`workspace-panel ${panelState.right ? 'w-14 min-w-[56px]' : 'flex-1 min-w-[280px]'} bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden relative shadow-2xl`}>
          {!panelState.right ? (
            <>
              <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                    <i className="fa-solid fa-sd-card"></i>
                  </div>
                  <div>
                    <h2 className="font-extrabold text-white text-xs uppercase tracking-wider">SD Card</h2>
                  </div>
                  <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                    <input
                      type="text"
                      value={sdSearch}
                      onChange={(e) => setSdSearch(e.target.value)}
                      placeholder=""
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                </div>
                <button onClick={() => togglePanel('right')} className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 flex-shrink-0 cursor-pointer border-2 border-rose-400/40 active:scale-90 transition-all">
                  <i className="fa-solid fa-minus text-xs"></i>
                </button>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden p-3">
                {/* THANH 2 TAB NHỎ PHÂN LOẠI THẺ */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 mb-2.5">
                  <button
                    onClick={() => setSdTypeTab('ALL')}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all ${sdTypeTab === 'ALL' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setSdTypeTab('VIDEO')}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${sdTypeTab === 'VIDEO' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    <i className="fa-solid fa-video text-[9px]"></i>
                    <span>Thẻ Quay</span>
                  </button>
                  <button
                    onClick={() => setSdTypeTab('AUDIO')}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${sdTypeTab === 'AUDIO' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    <i className="fa-solid fa-microphone text-[9px]"></i>
                    <span>Thẻ Âm Thanh</span>
                  </button>
                </div>

                {/* BỘ LỌC TÌM KIẾM VÀ DUNG LƯỢNG */}
                <div className="grid grid-cols-1 gap-2 mb-3">


                  <select
                    value={sdCapacityFilter}
                    onChange={(e) => setSdCapacityFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">Tất cả dung lượng</option>
                    <option value="128GB">128 GB</option>
                    <option value="256GB">256 GB</option>
                    <option value="32GB">32 GB (Audio)</option>
                  </select>
                </div>

                {/* DANH SÁCH THẺ NHỚ */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropOnPool}
                  className="flex-1 overflow-y-auto space-y-2 pr-1 transition-all"
                >
                  {filteredSDCards.length === 0 ? (
                    <div className="text-center p-6 text-slate-500 text-xs">
                      <i className="fa-solid fa-sd-card text-xl mb-1 block"></i>Không tìm thấy thẻ nhớ
                    </div>
                  ) : (
                    filteredSDCards.map(card => {
                      const isAvail = card.status === true || card.status === 'AVAILABLE' || card.status === 'true';
                      const isVideo = card.isVideoCard !== false;

                      return (
                        <div
                          key={card.id}
                          draggable={isAvail}
                          onDragStart={(e) => {
                            const payload = { type: 'SD_TO_PROJECT', cardId: card.id };
                            e.dataTransfer.setData('text/plain', JSON.stringify(payload));
                          }}
                          className={`bg-slate-900 border ${isAvail ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800 opacity-60'} p-2.5 rounded-xl transition-all`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-indigo-400 text-xs truncate">{card.id}</span>

                                <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${isVideo
                                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  }`}>
                                  {isVideo ? 'Thẻ Quay' : 'Âm Thanh'}
                                </span>

                                <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                  {card.capacity}
                                </span>

                                {!isAvail && (
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    {/* Tra cứu tên từ ID */}
                                    Đang ở: {getProjectName(card.currentProject)}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{card.note || 'Thẻ chuẩn quay Media Mice'}</div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              {isAvail && (
                                <div className="p-1 text-slate-600 hover:text-indigo-400 cursor-grab text-xs">
                                  <i className="fa-solid fa-grip-vertical"></i>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Khả dụng: <strong className="text-emerald-400 font-mono font-bold">{sdCardList.filter(i => i.status === true || i.status === 'AVAILABLE' || i.status === 'true').length}</strong> | Đang dùng: <strong className="text-indigo-400 font-mono font-bold">{sdCardList.filter(i => i.status === false || i.status === 'UNAVAILABLE' || i.status === 'false').length}</strong></span>
                </div>
              </div>
            </>
          ) : (
            <div
              onClick={() => togglePanel('right')}
              className="flex-1 flex flex-col items-center justify-between p-3 my-2 mx-auto w-11 bg-slate-950 border border-slate-800 rounded-3xl cursor-pointer hover:border-indigo-500/60 hover:bg-indigo-950/20 transition-all group shadow-xl"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all flex-shrink-0 border border-indigo-500/30">
                <i className="fa-solid fa-arrows-left-right text-xs"></i>
              </div>
              <div className="writing-mode-vertical text-[11px] font-extrabold text-slate-300 tracking-widest uppercase my-auto py-3 select-none group-hover:text-indigo-300">
                THẺ NHỚ
              </div>
              <div className="font-mono font-black text-xs text-indigo-400 bg-indigo-950/50 px-1.5 py-0.5 rounded-full border border-indigo-800/40 flex-shrink-0">
                {sdCardList.length}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          <div className={`px-3.5 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 text-white ${toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-600' : 'bg-blue-600'}`}>
            <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}`}></i>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* MODAL EQUIPMENT */}
      {modalType === 'EQUIPMENT' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">{editingItem ? 'Chỉnh Sửa Thiết Bị' : 'Thêm Thiết Bị Mới'}</h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white p-1"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const itemToSave = {
                  ...eqForm,
                  status: editingItem ? editingItem.status : true,
                  currentProject: editingItem ? editingItem.currentProject : null
                };
                if (editingItem) {
                  setEquipmentList(prev => prev.map(i => i.id === eqForm.id ? itemToSave : i));
                } else {
                  if (equipmentList.some(i => i.id === eqForm.id)) { showToast("Mã CODE trùng!", "error"); return; }
                  setEquipmentList(prev => [...prev, itemToSave]);
                }
                supabase.from('equipment').upsert([itemToSave]).then();
                setModalType(null);
                showToast("Lưu thiết bị thành công!", "success");
              }}
              className="p-5 space-y-3 overflow-y-auto flex-1"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mã CODE ID *</label>
                  <input
                    type="text"
                    required
                    readOnly={!!editingItem}
                    value={eqForm.id}
                    onChange={(e) => setEqForm({ ...eqForm, id: e.target.value.toUpperCase() })}
                    placeholder="MM-CAM-S5-1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 uppercase read-only:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Danh Mục *</label>
                  <select
                    value={eqForm.category}
                    onChange={(e) => setEqForm({ ...eqForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Camera">Camera</option>
                    <option value="Lens">Lens</option>
                    <option value="Battery">Battery</option>
                    <option value="Mic Wireless">Mic Wireless</option>
                    <option value="Mic">Mic</option>
                    <option value="Sound Recorder">Sound Recorder</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Gimbal">Gimbal</option>
                    <option value="Tripod">Tripod</option>
                    <option value="Dock Charge">Dock Charge</option>
                    <option value="Filter">Filter</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tên Model *</label>
                  <input
                    type="text"
                    required
                    value={eqForm.name}
                    onChange={(e) => setEqForm({ ...eqForm, name: e.target.value })}
                    placeholder="Lumix S5..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tình Trạng *</label>
                  <select
                    value={eqForm.healthStatus}
                    onChange={(e) => setEqForm({ ...eqForm, healthStatus: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="GOOD">Tốt (100%)</option>
                    <option value="DAMAGED">Hư / Lỗi</option>
                    <option value="MAINTENANCE">Bảo Hành</option>
                    <option value="INCOMPLETE">Thiếu Phụ Kiện</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ghi Chú</label>
                <input
                  type="text"
                  value={eqForm.note}
                  onChange={(e) => setEqForm({ ...eqForm, note: e.target.value })}
                  placeholder="Chi tiết tình trạng..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                {editingItem && (
                  <button
                    type="button"
                    onClick={() => {
                      setEquipmentList(prev => prev.filter(i => i.id !== editingItem.id));
                      supabase.from('equipment').delete().eq('id', editingItem.id).then();
                      setModalType(null);
                      showToast("Đã xóa thiết bị!", "info");
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30"
                  >
                    Xóa Máy
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button type="button" onClick={() => setModalType(null)} className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800">Hủy</button>
                  <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white">Lưu Thay Đổi</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalType === 'CONFIRM_DELETE' && (
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
      )}

      {/* MODAL PROJECT */}
      {modalType === 'PROJECT' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Tạo Dự Án Mới</h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white p-1"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newProj = {
                  id: 'PROJ-' + Date.now(),
                  name: projForm.name,
                  year: projForm.year,
                  borrower: projForm.borrower,
                  handoverDate: projForm.handoverDate,
                  items: []
                };
                setProjectList(prev => [...prev, newProj]);
                supabase.from('projects').upsert([newProj]).then();
                setActiveYear(projForm.year);
                setActiveProjectId(newProj.id);
                setModalType(null);
                showToast(`Đã tạo dự án ${projForm.name}!`, "success");
              }}
              className="p-5 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Năm Dự Án *</label>
                  <select
                    value={projForm.year}
                    onChange={(e) => setProjForm({ ...projForm, year: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {yearsList.map(y => <option key={y} value={y}>Năm {y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ngày Bàn Giao *</label>
                  <input
                    type="date"
                    required
                    value={projForm.handoverDate}
                    onChange={(e) => setProjForm({ ...projForm, handoverDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tên Dự Án *</label>
                <input
                  type="text"
                  required
                  placeholder="Dự án 4 - TVC Commercial..."
                  value={projForm.name}
                  onChange={(e) => setProjForm({ ...projForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Người Phụ Trách *</label>
                <input
                  type="text"
                  required
                  placeholder="Chris / Sven / Ha..."
                  value={projForm.borrower}
                  onChange={(e) => setProjForm({ ...projForm, borrower: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800">Hủy</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white">Tạo Dự Án</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}