import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Droplet,
  ArrowLeftRight,
  Eye,
  Fish,
  FileText,
  MapPin,
  Loader2,
} from 'lucide-react';
import { Pond, PondLog, LogType } from '../types';
import { getCurrentCoordinates } from '../lib/location';

interface DailyLogModalProps {
  isOpen: boolean;
  ponds: Pond[];
  initialPondId?: string;
  logToEdit?: PondLog | null;
  initialType?: LogType;
  onClose: () => void;
  onSave: (logData: {
    id?: string;
    pondId: string;
    type: LogType;
    recordedAt?: string;
    temperature?: number | null;
    ph?: number | null;
    salinity?: number | null;
    dissolvedOxygen?: number | null;
    exchangeType?: 'IN' | 'OUT' | 'CIRCULATE' | null;
    exchangeVolume?: string | null;
    observation?: string | null;
    mortalityCount?: number | null;
    harvestQuantity?: number | null;
    harvestUnit?: string | null;
    harvestPrice?: number | null;
    notes?: string | null;
  }) => void;
}

export const DailyLogModal: React.FC<DailyLogModalProps> = ({
  isOpen,
  ponds,
  initialPondId,
  logToEdit,
  initialType = 'WATER_QUALITY',
  onClose,
  onSave,
}) => {
  const [selectedPondId, setSelectedPondId] = useState(
    initialPondId || ponds[0]?.id || ''
  );
  const [logType, setLogType] = useState<LogType>(initialType);
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);

  // Water Quality
  const [doVal, setDoVal] = useState('');
  const [phVal, setPhVal] = useState('');
  const [salinityVal, setSalinityVal] = useState('');
  const [tempVal, setTempVal] = useState('');

  // Water Exchange
  const [exchangeType, setExchangeType] = useState<'IN' | 'OUT' | 'CIRCULATE'>('IN');
  const [exchangeVolume, setExchangeVolume] = useState('รับน้ำเข้า 30 ซม.');

  // Animal Observation
  const [observation, setObservation] = useState('');
  const [mortalityCount, setMortalityCount] = useState('');

  // Harvest
  const [harvestQuantity, setHarvestQuantity] = useState('');
  const [harvestUnit, setHarvestUnit] = useState('กก.');
  const [harvestPrice, setHarvestPrice] = useState('');

  // Notes & Timestamp
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (logToEdit) {
      setSelectedPondId(logToEdit.pondId);
      setLogType(logToEdit.type);
      setDoVal(
        logToEdit.dissolvedOxygen != null ? String(logToEdit.dissolvedOxygen) : ''
      );
      setPhVal(logToEdit.ph != null ? String(logToEdit.ph) : '');
      setSalinityVal(logToEdit.salinity != null ? String(logToEdit.salinity) : '');
      setTempVal(logToEdit.temperature != null ? String(logToEdit.temperature) : '');
      setExchangeType(logToEdit.exchangeType || 'IN');
      setExchangeVolume(logToEdit.exchangeVolume || '');
      setObservation(logToEdit.observation || '');
      setMortalityCount(
        logToEdit.mortalityCount != null ? String(logToEdit.mortalityCount) : ''
      );
      setHarvestQuantity(
        logToEdit.harvestQuantity != null ? String(logToEdit.harvestQuantity) : ''
      );
      setHarvestUnit(logToEdit.harvestUnit || 'กก.');
      setHarvestPrice(
        logToEdit.harvestPrice != null ? String(logToEdit.harvestPrice) : ''
      );
      setNotes(logToEdit.notes || '');
    } else {
      setSelectedPondId(initialPondId || ponds[0]?.id || '');
      setLogType(initialType);
      setDoVal('');
      setPhVal('');
      setSalinityVal('');
      setTempVal('');
      setExchangeType('IN');
      setExchangeVolume('รับน้ำเข้า 30 ซม.');
      setObservation('');
      setMortalityCount('');
      setHarvestQuantity('');
      setHarvestUnit('กก.');
      setHarvestPrice('');
      setNotes('');
    }
  }, [logToEdit, initialPondId, initialType, isOpen, ponds]);

  if (!isOpen) return null;

  const isEditing = Boolean(logToEdit);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPondId) return;

    onSave({
      id: logToEdit?.id,
      pondId: selectedPondId,
      type: logType,
      recordedAt: logToEdit?.recordedAt || new Date().toISOString(),
      temperature: tempVal ? parseFloat(tempVal) : null,
      ph: phVal ? parseFloat(phVal) : null,
      salinity: salinityVal ? parseFloat(salinityVal) : null,
      dissolvedOxygen: doVal ? parseFloat(doVal) : null,
      exchangeType: logType === 'WATER_EXCHANGE' ? exchangeType : null,
      exchangeVolume: logType === 'WATER_EXCHANGE' ? exchangeVolume || null : null,
      observation: logType === 'ANIMAL_OBSERVATION' ? observation || null : null,
      mortalityCount:
        logType === 'ANIMAL_OBSERVATION' && mortalityCount
          ? parseInt(mortalityCount, 10)
          : null,
      harvestQuantity:
        logType === 'HARVEST' && harvestQuantity ? parseFloat(harvestQuantity) : null,
      harvestUnit: logType === 'HARVEST' ? harvestUnit || null : null,
      harvestPrice:
        logType === 'HARVEST' && harvestPrice ? parseFloat(harvestPrice) : null,
      notes: notes.trim() || null,
    });
    onClose();
  };

  const handleCaptureLocation = async () => {
    setIsLocating(true);
    setLocationSuccess(null);
    try {
      const coords = await getCurrentCoordinates();
      const locStr = `📍 พิกัดจุดตรวจ: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)} (±${Math.round(coords.accuracy)}ม.)`;
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

  const navTypes: { type: LogType; label: string; icon: React.ReactNode }[] = [
    { type: 'WATER_QUALITY', label: 'ค่าน้ำ', icon: <Droplet className="w-4 h-4" /> },
    {
      type: 'WATER_EXCHANGE',
      label: 'ถ่ายน้ำ',
      icon: <ArrowLeftRight className="w-4 h-4" />,
    },
    {
      type: 'ANIMAL_OBSERVATION',
      label: 'สังเกตกุ้ง/ปู',
      icon: <Eye className="w-4 h-4" />,
    },
    { type: 'HARVEST', label: 'จับผลผลิต', icon: <Fish className="w-4 h-4" /> },
    {
      type: 'GENERAL_NOTE',
      label: 'บันทึกทั่วไป',
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <h3 className="text-xl font-bold text-slate-900">
            {isEditing ? '✏️ แก้ไขบันทึก (แก้ไขข้อผิดพลาด)' : '📝 บันทึกข้อมูลประจำวัน'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pond Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              บ่อเลี้ยง <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedPondId}
              onChange={(e) => setSelectedPondId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-base focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              required
            >
              {ponds.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.status === 'RESTING' ? '(พักบ่อ)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              ประเภทบันทึก
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
              {navTypes.map((tab) => (
                <button
                  key={tab.type}
                  type="button"
                  onClick={() => setLogType(tab.type)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    logType === tab.type
                      ? 'bg-white text-sky-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Dynamic Inputs based on type */}

          {/* 1. Water Quality */}
          {logType === 'WATER_QUALITY' && (
            <div className="space-y-3 bg-sky-50/50 p-3.5 rounded-2xl border border-sky-100">
              <div className="flex items-center justify-between text-xs text-sky-800 font-medium">
                <span>ค่าน้ำคุณภาพ (กรอกเฉพาะค่าที่วัดได้ ไม่บังคับ)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    DO ออกซิเจนในน้ำ (mg/L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    placeholder="เช่น 4.8"
                    value={doVal}
                    onChange={(e) => setDoVal(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-base"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    ต่ำกว่า 3.5 ควรระวัง
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    pH ความเป็นกรด-ด่าง
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    placeholder="เช่น 7.8"
                    value={phVal}
                    onChange={(e) => setPhVal(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-base"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    ช่วงที่เหมาะสม 7.5 - 8.3
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ความเค็มน้ำ (ppt)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="เช่น 18.0"
                    value={salinityVal}
                    onChange={(e) => setSalinityVal(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    อุณหภูมิน้ำ (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="60"
                    placeholder="เช่น 29.5"
                    value={tempVal}
                    onChange={(e) => setTempVal(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-base"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Water Exchange */}
          {logType === 'WATER_EXCHANGE' && (
            <div className="space-y-3 bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100">
              <label className="block text-xs font-semibold text-slate-700">
                ทิศทางการถ่ายน้ำ
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setExchangeType('IN')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs cursor-pointer border ${
                    exchangeType === 'IN'
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  สูบเข้า (IN)
                </button>
                <button
                  type="button"
                  onClick={() => setExchangeType('OUT')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs cursor-pointer border ${
                    exchangeType === 'OUT'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  ปล่อยออก (OUT)
                </button>
                <button
                  type="button"
                  onClick={() => setExchangeType('CIRCULATE')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs cursor-pointer border ${
                    exchangeType === 'CIRCULATE'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  หมุนเวียนน้ำ
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ปริมาณน้ำหรือระดับน้ำ
                </label>
                <input
                  type="text"
                  placeholder="เช่น รับน้ำเข้า 30 ซม., ถ่ายออก 20%"
                  value={exchangeVolume}
                  onChange={(e) => setExchangeVolume(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-base"
                />
              </div>
            </div>
          )}

          {/* 3. Animal Observation */}
          {logType === 'ANIMAL_OBSERVATION' && (
            <div className="space-y-3 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อาการหรือพฤติกรรมสัตว์น้ำที่พบ
                </label>
                <input
                  type="text"
                  placeholder="เช่น กุ้งว่ายหาอาหารดี, ลอยหัวริมขอบบ่อ, ปูกินเหยื่อดี"
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  จำนวนสัตว์น้ำที่ตายหรือผิดปกติ (ตัว) - ใส่ 0 ได้
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={mortalityCount}
                  onChange={(e) => setMortalityCount(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-base"
                />
              </div>
            </div>
          )}

          {/* 4. Harvest */}
          {logType === 'HARVEST' && (
            <div className="space-y-3 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ปริมาณที่จับได้
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="เช่น 120"
                    value={harvestQuantity}
                    onChange={(e) => setHarvestQuantity(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หน่วยนับ
                  </label>
                  <input
                    type="text"
                    value={harvestUnit}
                    onChange={(e) => setHarvestUnit(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ราคาขายรวม (บาท) - ไม่บังคับ
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="เช่น 28000"
                  value={harvestPrice}
                  onChange={(e) => setHarvestPrice(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-base font-bold text-slate-900"
                />
              </div>
            </div>
          )}

          {/* Notes & Location */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                หมายเหตุ & พิกัดจุดตรวจ
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
              placeholder="ระบุข้อสังเกตเพิ่มเติม เช่น สีน้ำ, สภาพอากาศ, สภาพคันบ่อ..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
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
              <span>{isEditing ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
