import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import { getTrailingNumber } from './utils/Helpers';

import Header from './components/Header';
import Toast from './components/Toast';
import ProjectPanel from './components/ProjectPanel';
import EquipmentPanel from './components/EquipmentPanel';
import SdCardPanel from './components/SdCardPanel';

import EquipmentModal from './modals/EquipmentModal';
import ProjectModal from './modals/ProjectModal';
import ConfirmDeleteModal from './modals/ConfirmDeleteModal';
import PrintModal from './modals/PrintModal';
import SdModal from './modals/SdModal';

export default function App() {
  const [equipmentList, setEquipmentList] = useState([]);
  const [sdCardList, setSdCardList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [yearsList, setYearsList] = useState([new Date().getFullYear().toString()]);
  const [activeYear, setActiveYear] = useState(new Date().getFullYear().toString());
  const [activeProjectId, setActiveProjectId] = useState(null);

  const [projectSearch, setProjectSearch] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('ALL');
  const [sdSearch, setSdSearch] = useState('');
  const [sdCapacityFilter, setSdCapacityFilter] = useState('ALL');

  const [panelState, setPanelState] = useState({ left: false, center: false, right: false });
  const [expandedEquipmentIds, setExpandedEquipmentIds] = useState(new Set());

  const projectTabsRef = useRef(null);
  const yearTabsRef = useRef(null);

  const [modalType, setModalType] = useState(null);
  const [editingItem, setEditingEquipment] = useState(null);
  const [toast, setToast] = useState(null);

  const [eqForm, setEqForm] = useState({ id: '', category: 'Camera', name: '', healthStatus: 'GOOD', note: '', subDevices: [] });
  const [sdForm, setSdForm] = useState({ id: '', quantity: 1, speed: 'V30', capacity: '128GB', healthStatus: 'GOOD', note: '' });
  const [projForm, setProjForm] = useState({ year: activeYear, name: '', borrower: '', handoverDate: new Date().toISOString().split('T')[0] });
  const [sdTypeTab, setSdTypeTab] = useState('VIDEO');

  const CATEGORY_PRIORITY = {
    'Camera': 1,
    'Lens': 2,
    'Battery': 3,
    'Mic Wireless': 4,
    'Mic': 5,
    'Sound Recorder': 6,
    'Lighting': 7,
    'Monitor': 8,
    'Wireless Video': 9,
    'Gimbal': 10,
    'Tripod': 11,
    'Slider': 12,
    'Dock Charge': 13,
    'Filter': 14,
    'CamLink': 15
  };

  const getCategoryOrder = (cat) => CATEGORY_PRIORITY[cat] || 99;

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

      if (eqRes.data) {
        // Sắp xếp ưu tiên: Theo Danh mục trước -> Sau đó tới Số đuôi ID
        const sortedEq = eqRes.data.sort((a, b) => {
          const catOrderA = getCategoryOrder(a.category);
          const catOrderB = getCategoryOrder(b.category);

          if (catOrderA !== catOrderB) {
            return catOrderA - catOrderB;
          }
          return getTrailingNumber(a.id) - getTrailingNumber(b.id);
        });
        setEquipmentList(sortedEq);
      }

      if (sdRes.data) {
        const sortedSd = sdRes.data.sort((a, b) => getTrailingNumber(a.id) - getTrailingNumber(b.id));
        setSdCardList(sortedSd);
      }

      if (projRes.data) {
        const sortedProjs = [...projRes.data].sort((a, b) => a.id.localeCompare(b.id));
        setProjectList(sortedProjs);

        setActiveProjectId((prevId) => {
          if (prevId && sortedProjs.some((p) => p.id === prevId)) return prevId;
          const projsInCurrentYear = sortedProjs.filter((p) => p.year.toString() === activeYear.toString());
          return projsInCurrentYear.length > 0 ? projsInCurrentYear[0].id : (sortedProjs[0]?.id || null);
        });
      }

      if (setRes.data?.years) {
        const sortedYears = [...setRes.data.years].sort((a, b) => Number(a) - Number(b));
        setYearsList(sortedYears);
      }
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

    const updatedProjItems = activeProj.items.map((i) =>
      i.status === 'BORROWED' ? { ...i, status: 'RETURNED' } : i
    );
    const updatedProj = { ...activeProj, items: updatedProjItems };

    const borrowedEqIds = new Set(borrowed.filter((i) => i.itemType !== 'SD_CARD').map((i) => i.id));
    const borrowedSdIds = new Set(borrowed.filter((i) => i.itemType === 'SD_CARD').map((i) => i.id));

    const updatedEqList = equipmentList.map((eq) =>
      borrowedEqIds.has(eq.id) ? { ...eq, status: true, currentProject: null } : eq
    );

    const updatedSdList = sdCardList.map((sd) =>
      borrowedSdIds.has(sd.id) ? { ...sd, status: true, currentProject: null } : sd
    );

    setEquipmentList(updatedEqList);
    setSdCardList(updatedSdList);
    setProjectList((prev) => prev.map((p) => (p.id === activeProj.id ? updatedProj : p)));

    const eqToUpsert = updatedEqList.filter((eq) => borrowedEqIds.has(eq.id));
    const sdToUpsert = updatedSdList.filter((sd) => borrowedSdIds.has(sd.id));

    if (eqToUpsert.length > 0) supabase.from('equipment').upsert(eqToUpsert).then();
    if (sdToUpsert.length > 0) supabase.from('sd_cards').upsert(sdToUpsert).then();
    supabase.from('projects').upsert([updatedProj]).then();

    showToast(`Đã bàn giao tất cả ${borrowed.length} món về kho thành công!`, 'success');
  };

  const handleExecuteDeleteProject = async () => {
    const activeProj = projectList.find((p) => p.id === activeProjectId);
    if (!activeProj) return;

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

    setProjectList((prev) => prev.filter((p) => p.id !== activeProjectId));
    await supabase.from('projects').delete().eq('id', activeProjectId);

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

        const updatedProjItems = (activeProj.items || []).filter((i) => i.id !== itemId);
        const updatedProj = { ...activeProj, items: updatedProjItems };

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
      <Header
        projectSearch={projectSearch}
        setProjectSearch={setProjectSearch}
        projectList={projectList}
        setActiveYear={setActiveYear}
        setActiveProjectId={setActiveProjectId}
        setEditingEquipment={setEditingEquipment}
        setEqForm={setEqForm}
        setModalType={setModalType}
        loadAllDataFromSupabase={loadAllDataFromSupabase}
      />

      <main className="flex-1 flex overflow-hidden p-3 gap-3 bg-slate-950 relative">
        <ProjectPanel
          panelState={panelState}
          togglePanel={togglePanel}
          yearsList={yearsList}
          activeYear={activeYear}
          setActiveYear={setActiveYear}
          projectList={projectList}
          activeProjectId={activeProjectId}
          setActiveProjectId={setActiveProjectId}
          activeProject={activeProject}
          borrowedItems={borrowedItems}
          returnedItems={returnedItems}
          handleDropOnProject={handleDropOnProject}
          handleReturnAllItems={handleReturnAllItems}
          returnSingleItem={returnSingleItem}
          setModalType={setModalType}
          yearTabsRef={yearTabsRef}
          projectTabsRef={projectTabsRef}
          handleHorizontalScroll={handleHorizontalScroll}
          setYearsList={setYearsList}
          supabase={supabase}
        />

        <EquipmentPanel
          panelState={panelState}
          togglePanel={togglePanel}
          inventorySearch={inventorySearch}
          setInventorySearch={setInventorySearch}
          inventoryCategory={inventoryCategory}
          setInventoryCategory={setInventoryCategory}
          filteredEquipment={filteredEquipment}
          equipmentList={equipmentList}
          handleDropOnPool={handleDropOnPool}
          expandedEquipmentIds={expandedEquipmentIds}
          setExpandedEquipmentIds={setExpandedEquipmentIds}
          setEditingEquipment={setEditingEquipment}
          setEqForm={setEqForm}
          setModalType={setModalType}
          getProjectName={getProjectName}
        />

        <SdCardPanel
          panelState={panelState}
          togglePanel={togglePanel}
          sdSearch={sdSearch}
          setSdSearch={setSdSearch}
          sdTypeTab={sdTypeTab}
          setSdTypeTab={setSdTypeTab}
          sdCapacityFilter={sdCapacityFilter}
          setSdCapacityFilter={setSdCapacityFilter}
          filteredSDCards={filteredSDCards}
          sdCardList={sdCardList}
          handleDropOnPool={handleDropOnPool}
          getProjectName={getProjectName}
        />
      </main>

      <Toast toast={toast} />

      <EquipmentModal
        modalType={modalType}
        setModalType={setModalType}
        editingItem={editingItem}
        eqForm={eqForm}
        setEqForm={setEqForm}
        setEquipmentList={setEquipmentList}
        equipmentList={equipmentList}
        supabase={supabase}
        showToast={showToast}
      />

      <ProjectModal
        modalType={modalType}
        setModalType={setModalType}
        projForm={projForm}
        setProjForm={setProjForm}
        yearsList={yearsList}
        setProjectList={setProjectList}
        supabase={supabase}
        setActiveYear={setActiveYear}
        setActiveProjectId={setActiveProjectId}
        showToast={showToast}
      />

      <SdModal
        modalType={modalType}
        setModalType={setModalType}
        sdCardList={sdCardList}
        setSdCardList={setSdCardList}
        supabase={supabase}
        showToast={showToast}
      />

      <ConfirmDeleteModal
        modalType={modalType}
        setModalType={setModalType}
        activeProject={activeProject}
        handleExecuteDeleteProject={handleExecuteDeleteProject}
      />

      <PrintModal
        modalType={modalType}
        setModalType={setModalType}
        activeProject={activeProject}
      />
    </div>
  );
}