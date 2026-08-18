import React from 'react';

export default function Header({
  projectSearch,
  setProjectSearch,
  projectList,
  setActiveYear,
  setActiveProjectId,
  setEditingEquipment,
  setEqForm,
  setModalType,
  loadAllDataFromSupabase
}) {
  return (
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

      <div className="flex items-center gap-2">
        <button
          onClick={() => { setEditingEquipment(null); setEqForm({ id: '', category: 'Camera', name: '', healthStatus: 'GOOD', note: '', subDevices: [] }); setModalType('EQUIPMENT'); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
        >
          <i className="fa-solid fa-plus text-[10px]"></i>
          <span className="hidden md:inline">Thiết Bị</span>
        </button>

        <button
          onClick={() => setModalType('SD')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all"
        >
          <i className="fa-solid fa-sd-card text-[10px]"></i>
          <span className="hidden md:inline">Thẻ Nhớ</span>
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
  );
}