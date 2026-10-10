import React, { useState, useEffect } from 'react';
import { X, Trash2, Check, MapPin, Loader2 } from 'lucide-react';
import { Pond, PondStatus } from '../types';
import { getCurrentCoordinates } from '../lib/location';

interface PondModalProps {
  isOpen: boolean;
  pondToEdit?: Pond | null;
  onClose: () => void;
  onSave: (pondData: {
    id?: string;
    name: string;
    area?: number;
    waterSource?: string;
    species?: string;
    farmingMethod?: string;
    status: PondStatus;
    notes?: string;
  }) => void;
  onDelete?: (pondId: string) => void;
}

export const PondModal: React.FC<PondModalProps> = ({
  isOpen,
  pondToEdit,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [waterSource, setWaterSource] = useState('');
  const [species, setSpecies] = useState('');
  const [farmingMethod, setFarmingMethod] = useState('');
  const [status, setStatus] = useState<PondStatus>('ACTIVE');
  const [notes, setNotes] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);

  const handleCaptureLocation = async () => {
    setIsLocating(true);
    setLocationSuccess(null);
    try {
      const coords = await getCurrentCoordinates();
      const locStr = `📍 พิกัด GPS: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)} (±${Math.round(coords.accuracy)}ม.)`;
      setNotes((prev) => (prev ? `${prev}\n${locStr}` : locStr));
      setLocationSuccess(
        `บันทึกพิกัดสำเร็จ (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ไม่สามารถดึงตำแหน่งได้');
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (pondToEdit) {
      setName(pondToEdit.name || '');
      setArea(pondToEdit.area != null ? String(pondToEdit.area) : '');
      setWaterSource(pondToEdit.waterSource || '');
      setSpecies(pondToEdit.species || '');
      setFarmingMethod(pondToEdit.farmingMethod || '');
      setStatus(pondToEdit.status || 'ACTIVE');
      setNotes(pondToEdit.notes || '');
    } else {
      setName('');
      setArea('');
      setWaterSource('');
      setSpecies('');
      setFarmingMethod('ธรรมชาติ (ไม่ใช้อาหารเม็ด รับลูกกุ้งตามน้ำหลาก)');
      setStatus('ACTIVE');
      setNotes('');
    }
  }, [pondToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: pondToEdit?.id,
      name: name.trim(),
      area: area ? parseFloat(area) : undefined,
      waterSource: waterSource.trim() || undefined,
      species: species.trim() || undefined,
      farmingMethod: farmingMethod.trim() || undefined,
      status,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  const isEditing = Boolean(pondToEdit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <h3 className="text-xl font-bold text-slate-900">
            {isEditing ? '✏️ แก้ไขข้อมูลบ่อ' : '➕ เพิ่มบ่อเลี้ยงใหม่'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pond Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              ชื่อบ่อ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น บ่อ 1 (บ่อกุ้งธรรมชาติ)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>

          {/* Area & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ขนาดพื้นที่ (ไร่) - ไม่บังคับ
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="เช่น 10.5"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สถานะบ่อ
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PondStatus)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base"
              >
                <option value="ACTIVE">กำลังเลี้ยง (ACTIVE)</option>
                <option value="RESTING">พักบ่อ / ตากเลน (RESTING)</option>
                <option value="HARVESTED">จับผลผลิตแล้ว (HARVESTED)</option>
              </select>
            </div>
          </div>

          {/* Water source & Species */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                แหล่งน้ำ (ไม่บังคับ)
              </label>
              <input
                type="text"
                placeholder="เช่น น้ำคลองธรรมชาติ, น้ำทะเล"
                value={waterSource}
                onChange={(e) => setWaterSource(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สัตว์น้ำที่เลี้ยง (ไม่บังคับ)
              </label>
              <input
                type="text"
                placeholder="เช่น กุ้งแชบ๊วย, ปูดำ"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base"
              />
            </div>
          </div>

          {/* Farming Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              วิธีการเลี้ยง (ไม่บังคับ)
            </label>
            <input
              type="text"
              placeholder="เช่น ธรรมชาติ (ไม่ใช้อาหารเม็ด), กึ่งธรรมชาติ"
              value={farmingMethod}
              onChange={(e) => setFarmingMethod(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base"
            />
            {/* Quick buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button
                type="button"
                onClick={() =>
                  setFarmingMethod('ธรรมชาติ (ไม่ใช้อาหารเม็ด รับลูกกุ้งตามน้ำหลาก)')
                }
                className="text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                + ธรรมชาติ
              </button>
              <button
                type="button"
                onClick={() => setFarmingMethod('กึ่งธรรมชาติ (ให้อาหารเสริมบางช่วง)')}
                className="text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                + กึ่งธรรมชาติ
              </button>
              <button
                type="button"
                onClick={() => setFarmingMethod('บ่อพักน้ำ / ตกตะกอน')}
                className="text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                + บ่อพักน้ำ
              </button>
            </div>
          </div>

          {/* Notes & Location */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                หมายเหตุ & พิกัดบ่อ
              </label>
              <button
                type="button"
                onClick={handleCaptureLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLocating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                )}
                <span>{isLocating ? 'กำลังหาพิกัด...' : '📍 ดึงพิกัด GPS'}</span>
              </button>
            </div>
            {locationSuccess && (
              <p className="text-[11px] text-emerald-700 font-medium mb-1">
                ✓ {locationSuccess}
              </p>
            )}
            <textarea
              rows={2}
              placeholder="เช่น มีแนวต้นโกงกางบังลม, ประตูน้ำอยู่ทิศตะวันออก"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            {isEditing && onDelete && pondToEdit ? (
              <button
                type="button"
                onClick={() => onDelete(pondToEdit.id)}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>ลบบ่อนี้</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white rounded-xl text-sm font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isEditing ? 'บันทึกการแก้ไข' : 'สร้างบ่อ'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
