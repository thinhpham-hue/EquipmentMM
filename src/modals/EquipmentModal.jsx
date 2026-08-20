import React, { useState, useRef, useEffect } from 'react';

export default function EquipmentModal({ modalType, setModalType, editingItem, eqForm, setEqForm, setEquipmentList, equipmentList, supabase, showToast }) {
  if (modalType !== 'EQUIPMENT') return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">{editingItem ? 'Chỉnh Sửa Thiết Bị' : 'Thêm Thiết Bị Mới'}</h3>
          <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white p-1">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
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

          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-blue-400 uppercase">Thiết Bị Con (Sub-Devices)</label>
              <button
                type="button"
                onClick={() => {
                  setEqForm(prev => ({
                    ...prev,
                    subDevices: [...(prev.subDevices || []), { id: '', name: '', healthStatus: 'GOOD' }]
                  }));
                }}
                className="px-2 py-1 rounded text-xs bg-slate-800 text-blue-400 hover:text-white border border-slate-700"
              >
                + Sub
              </button>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {(eqForm.subDevices || []).map((sub, index) => (
                <div key={index} className="flex items-center gap-2 bg-slate-950 p-1.5 rounded border border-slate-800">
                  <input
                    type="text"
                    placeholder="Mã Sub ID"
                    required
                    value={sub.id}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setEqForm(prev => {
                        const updated = [...prev.subDevices];
                        updated[index] = { ...updated[index], id: val };
                        return { ...prev, subDevices: updated };
                      });
                    }}
                    className="w-1/3 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white uppercase"
                  />
                  <input
                    type="text"
                    placeholder="Tên Sub"
                    required
                    value={sub.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEqForm(prev => {
                        const updated = [...prev.subDevices];
                        updated[index] = { ...updated[index], name: val };
                        return { ...prev, subDevices: updated };
                      });
                    }}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEqForm(prev => ({
                        ...prev,
                        subDevices: prev.subDevices.filter((_, i) => i !== index)
                      }));
                    }}
                    className="text-rose-400 p-1 hover:text-rose-300"
                  >
                    <i className="fa-solid fa-xmark text-xs"></i>
                  </button>
                </div>
              ))}
            </div>
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
  );
}