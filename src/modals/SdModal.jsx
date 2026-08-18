import React, { useState } from 'react';

export default function SdModal({ modalType, setModalType, sdCardList, setSdCardList, supabase, showToast }) {
  const [form, setForm] = useState({
    id: '',
    capacity: '128GB',
    isVideoCard: true,
    healthStatus: 'GOOD',
    note: ''
  });

  if (modalType !== 'SD') return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedId = form.id.trim().toUpperCase();

    if (!formattedId) {
      showToast("Vui lòng nhập Mã CODE thẻ!", "error");
      return;
    }

    if (sdCardList.some((c) => c.id === formattedId)) {
      showToast(`Mã thẻ "${formattedId}" đã tồn tại!`, "error");
      return;
    }

    const newCard = {
      id: formattedId,
      capacity: form.capacity,
      status: true, // true = Khả dụng
      healthStatus: form.healthStatus,
      currentProject: null,
      note: form.note.trim(),
      isVideoCard: form.isVideoCard
    };

    // 1. Cập nhật State React ngay lập tức
    setSdCardList((prev) => [...prev, newCard]);

    // 2. Đồng bộ lên Supabase
    const { error } = await supabase.from('sd_cards').insert([newCard]);

    if (error) {
      console.error("Lỗi thêm thẻ nhớ:", error);
      showToast("Lỗi đồng bộ dữ liệu với Supabase!", "error");
    } else {
      showToast(`Đã thêm thẻ nhớ ${formattedId} thành công!`, "success");
      setModalType(null);
      setForm({ id: '', capacity: '128GB', isVideoCard: true, healthStatus: 'GOOD', note: '' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <i className="fa-solid fa-sd-card text-indigo-400"></i>
            <span>Thêm Thẻ Nhớ Mới</span>
          </h3>
          <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white p-1">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mã CODE Thẻ *</label>
            <input
              type="text"
              required
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value.toUpperCase() })}
              placeholder="VD: MM-SD-128GB-V30-320"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Loại Thẻ *</label>
              <select
                value={form.isVideoCard}
                onChange={(e) => setForm({ ...form, isVideoCard: e.target.value === 'true' })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="true">Thẻ Quay (Video)</option>
                <option value="false">Thẻ Âm Thanh (Audio)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Dung Lượng *</label>
              <select
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="128GB">128 GB</option>
                <option value="256GB">256 GB</option>
                <option value="512GB">512 GB</option>
                <option value="32GB">32 GB (Audio)</option>
                <option value="64GB">64 GB</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tình Trạng *</label>
            <select
              value={form.healthStatus}
              onChange={(e) => setForm({ ...form, healthStatus: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="GOOD">Tốt (100%)</option>
              <option value="DAMAGED">Hư / Lỗi</option>
              <option value="MAINTENANCE">Bảo Hành</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Ghi Chú</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Chi tiết ghi chú..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
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
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all"
            >
              Lưu Thẻ Nhớ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}