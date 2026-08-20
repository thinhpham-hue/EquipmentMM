import React, { useState } from 'react';
import { getTrailingNumber } from '../utils/Helpers';

export default function AutoPickSdModal({
  modalType,
  setModalType,
  sdCardList,
  setSdCardList,
  activeProject,
  setProjectList,
  supabase,
  showToast
}) {
  const [counts, setCounts] = useState({
    sd128v30: 0,
    sd256v30: 0,
    sd256v60: 0,
    audio: 0
  });

  if (modalType !== 'AUTO_SD') return null;

  // Lọc danh sách thẻ khả dụng và có tình trạng TỐT (GOOD)
  const availableGoodCards = sdCardList.filter(
    (c) =>
      (c.status === true || c.status === 'AVAILABLE' || c.status === 'true') &&
      c.healthStatus === 'GOOD'
  );

  // Phân loại và sắp xếp ID từ nhỏ đến lớn
  const pool128v30 = availableGoodCards
    .filter((c) => c.capacity === '128GB' && c.isVideoCard !== false)
    .sort((a, b) => getTrailingNumber(a.id) - getTrailingNumber(b.id));

  const pool256v30 = availableGoodCards
    .filter((c) => c.capacity === '256GB' && c.id.includes('V30') && c.isVideoCard !== false)
    .sort((a, b) => getTrailingNumber(a.id) - getTrailingNumber(b.id));

  const pool256v60 = availableGoodCards
    .filter((c) => c.capacity === '256GB' && c.id.includes('V60') && c.isVideoCard !== false)
    .sort((a, b) => getTrailingNumber(a.id) - getTrailingNumber(b.id));

  const poolAudio = availableGoodCards
    .filter((c) => c.isVideoCard === false)
    .sort((a, b) => getTrailingNumber(a.id) - getTrailingNumber(b.id));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!activeProject) {
      showToast('Vui lòng chọn 1 dự án trước!', 'error');
      return;
    }

    const req128 = Number(counts.sd128v30) || 0;
    const req256v30 = Number(counts.sd256v30) || 0;
    const req256v60 = Number(counts.sd256v60) || 0;
    const reqAudio = Number(counts.audio) || 0;

    const totalReq = req128 + req256v30 + req256v60 + reqAudio;
    if (totalReq === 0) {
      showToast('Vui lòng nhập số lượng thẻ cần mượn!', 'info');
      return;
    }

    // Kiểm tra số lượng thẻ khả dụng trong kho
    if (req128 > pool128v30.length) {
      showToast(`Không đủ thẻ 128GB V30 khả dụng (Còn ${pool128v30.length} thẻ)`, 'error');
      return;
    }
    if (req256v30 > pool256v30.length) {
      showToast(`Không đủ thẻ 256GB V30 khả dụng (Còn ${pool256v30.length} thẻ)`, 'error');
      return;
    }
    if (req256v60 > pool256v60.length) {
      showToast(`Không đủ thẻ 256GB V60 khả dụng (Còn ${pool256v60.length} thẻ)`, 'error');
      return;
    }
    if (reqAudio > poolAudio.length) {
      showToast(`Không đủ thẻ Âm Thanh khả dụng (Còn ${poolAudio.length} thẻ)`, 'error');
      return;
    }

    // Lựa chọn các thẻ theo thứ tự ID nhỏ -> lớn
    const pickedCards = [
      ...pool128v30.slice(0, req128),
      ...pool256v30.slice(0, req256v30),
      ...pool256v60.slice(0, req256v60),
      ...poolAudio.slice(0, reqAudio)
    ];

    const pickedIdsSet = new Set(pickedCards.map((c) => c.id));

    // Cập nhật State danh sách Thẻ nhớ
    const updatedSdList = sdCardList.map((c) =>
      pickedIdsSet.has(c.id)
        ? { ...c, status: false, currentProject: activeProject.id }
        : c
    );

    // Bổ sung danh sách thẻ vào dự án
    const newItems = pickedCards.map((card) => ({
      id: card.id,
      name: `Thẻ ${card.id}`,
      capacity: card.capacity,
      itemType: 'SD_CARD',
      status: 'BORROWED'
    }));

    const updatedProj = {
      ...activeProject,
      items: [...(activeProject.items || []), ...newItems]
    };

    // Cập nhật React State
    setSdCardList(updatedSdList);
    setProjectList((prev) =>
      prev.map((p) => (p.id === activeProject.id ? updatedProj : p))
    );

    // Đồng bộ lên Supabase
    const upsertSdData = pickedCards.map((c) => ({
      id: c.id,
      status: false,
      currentProject: activeProject.id
    }));

    if (upsertSdData.length > 0) supabase.from('sd_cards').upsert(upsertSdData).then();
    supabase.from('projects').upsert([updatedProj]).then();

    showToast(`Đã tự động thêm ${pickedCards.length} thẻ nhớ vào dự án!`, 'success');
    setModalType(null);
    setCounts({ sd128v30: 0, sd256v30: 0, sd256v60: 0, audio: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <i className="fa-solid fa-wand-magic-sparkles text-indigo-400"></i>
            <span>Mượn Thẻ Tự Động Cho Dự Án</span>
          </h3>
          <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white p-1">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-300">
            Dự án nhận: <strong className="text-indigo-400">{activeProject?.name || '--'}</strong>
          </p>

          <div className="space-y-3">
            {/* 128GB V30 */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-white">Thẻ 128GB V30 (Quay)</label>
                <span className="text-[10px] text-slate-400">
                  Khả dụng (Tốt): <strong className="text-emerald-400 font-mono">{pool128v30.length}</strong> thẻ
                </span>
              </div>
              <input
                type="number"
                min="0"
                max={pool128v30.length}
                value={counts.sd128v30}
                onChange={(e) => setCounts({ ...counts, sd128v30: e.target.value })}
                className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold text-center focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* 256GB V30 */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-white">Thẻ 256GB V30 (Quay)</label>
                <span className="text-[10px] text-slate-400">
                  Khả dụng (Tốt): <strong className="text-emerald-400 font-mono">{pool256v30.length}</strong> thẻ
                </span>
              </div>
              <input
                type="number"
                min="0"
                max={pool256v30.length}
                value={counts.sd256v30}
                onChange={(e) => setCounts({ ...counts, sd256v30: e.target.value })}
                className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold text-center focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* 256GB V60 */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-white">Thẻ 256GB V60 (Quay)</label>
                <span className="text-[10px] text-slate-400">
                  Khả dụng (Tốt): <strong className="text-emerald-400 font-mono">{pool256v60.length}</strong> thẻ
                </span>
              </div>
              <input
                type="number"
                min="0"
                max={pool256v60.length}
                value={counts.sd256v60}
                onChange={(e) => setCounts({ ...counts, sd256v60: e.target.value })}
                className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold text-center focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Audio */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-white">Thẻ Âm Thanh (Audio)</label>
                <span className="text-[10px] text-slate-400">
                  Khả dụng (Tốt): <strong className="text-emerald-400 font-mono">{poolAudio.length}</strong> thẻ
                </span>
              </div>
              <input
                type="number"
                min="0"
                max={poolAudio.length}
                value={counts.audio}
                onChange={(e) => setCounts({ ...counts, audio: e.target.value })}
                className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold text-center focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <i className="fa-solid fa-check"></i>
              <span>Xác Nhận Mượn</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}