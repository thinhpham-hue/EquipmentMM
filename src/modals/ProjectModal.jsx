import React from 'react';

export default function ProjectModal({ modalType, setModalType, projForm, setProjForm, yearsList, setProjectList, supabase, setActiveYear, setActiveProjectId, showToast }) {
  if (modalType !== 'PROJECT') return null;

  return (
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
  );
}