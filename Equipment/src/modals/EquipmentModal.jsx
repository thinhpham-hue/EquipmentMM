import React, { useState, useEffect } from 'react';

export default function EquipmentModal({ isOpen, onClose, equipmentToEdit, onSave, onDelete }) {
  const [formData, setFormData] = useState({
    id: '',
    category: 'Camera',
    name: '',
    healthStatus: 'GOOD',
    note: '',
    subDevices: []
  });

  useEffect(() => {
    if (equipmentToEdit) {
      setFormData({
        id: equipmentToEdit.id || '',
        category: equipmentToEdit.category || 'Camera',
        name: equipmentToEdit.name || '',
        healthStatus: equipmentToEdit.healthStatus || 'GOOD',
        note: equipmentToEdit.note || '',
        subDevices: equipmentToEdit.subDevices || []
      });
    } else {
      setFormData({
        id: '',
        category: 'Camera',
        name: '',
        healthStatus: 'GOOD',
        note: '',
        subDevices: []
      });
    }
  }, [equipmentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddSub = () => {
    setFormData((prev) => ({
      ...prev,
      subDevices: [...prev.subDevices, { id: '', name: '', healthStatus: 'GOOD' }]
    }));
  };

  const handleSubChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.subDevices];
      updated[index][field] = value;
      return { ...prev, subDevices: updated };
    });
  };

  const handleRemoveSub = (index) => {
    setFormData((prev) => ({
      ...prev,
      subDevices: prev.subDevices.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, !!equipmentToEdit);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">
            {equipmentToEdit ? 'Chỉnh Sửa Thiết Bị' : 'Thêm Thiết Bị Mới'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mã CODE ID *</label>
              <input
                type="text"
                required
                readOnly={!!equipmentToEdit}
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                placeholder="MM-CAM-S5-1"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 uppercase read-only:opacity-70"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Danh Mục *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Lumix S5..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tình Trạng *</label>
              <select
                value={formData.healthStatus}
                onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value })}
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
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Chi tiết tình trạng..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-blue-400 uppercase">Thiết Bị Con (Sub-Devices)</label>
              <button
                type="button"
                onClick={handleAddSub}
                className="px-2 py-1 rounded text-xs bg-slate-800 text-blue-400 hover:text-white border border-slate-700"
              >
                + Sub
              </button>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {formData.subDevices.map((sub, index) => (
                <div key={index} className="flex items-center gap-2 bg-slate-950 p-1.5 rounded border border-slate-800">
                  <input
                    type="text"
                    placeholder="Mã Sub ID"
                    required
                    value={sub.id}
                    onChange={(e) => handleSubChange(index, 'id', e.target.value.toUpperCase())}
                    className="w-1/3 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white uppercase"
                  />
                  <input
                    type="text"
                    placeholder="Tên Sub"
                    required
                    value={sub.name}
                    onChange={(e) => handleSubChange(index, 'name', e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                  />
                  <button type="button" onClick={() => handleRemoveSub(index)} className="text-rose-400 p-1">
                    <i className="fa-solid fa-xmark text-xs"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
            {equipmentToEdit && (
              <button
                type="button"
                onClick={() => onDelete(equipmentToEdit.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30"
              >
                Xóa Máy
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800"
              >
                Hủy
              </button>
              <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white">
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}