import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Pond } from '../types';

interface QuickRecordModalProps {
  actionType: string | null;
  initialPondId?: string;
  ponds: Pond[];
  onClose: () => void;
  onSaveWater: (
    pondId: string,
    data: { do?: number; ph?: number; salinity?: number; temp?: number; notes?: string }
  ) => void;
  onSaveFinance: (data: {
    type: 'INCOME' | 'EXPENSE';
    category: string;
    amount: number;
    pondId?: string;
    note?: string;
  }) => void;
}

export const QuickRecordModal: React.FC<QuickRecordModalProps> = ({
  actionType,
  initialPondId,
  ponds,
  onClose,
  onSaveWater,
  onSaveFinance,
}) => {
  const [selectedPondId, setSelectedPondId] = useState(
    initialPondId || ponds[0]?.id || ''
  );

  // Water state
  const [doVal, setDoVal] = useState('');
  const [phVal, setPhVal] = useState('');
  const [salinityVal, setSalinityVal] = useState('');
  const [tempVal, setTempVal] = useState('');
  const [waterNotes, setWaterNotes] = useState('');

  // Finance state
  const [financeType, setFinanceType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [category, setCategory] = useState('ขายกุ้ง');
  const [amount, setAmount] = useState('');
  const [financeNote, setFinanceNote] = useState('');

  // Observation state
  const [observationText, setObservationText] = useState(
    'กุ้งว่ายดี กระจายตัวหาอาหารปกติ ไม่พบตัวตาย'
  );

  // Exchange state
  const [exchangeType, setExchangeType] = useState<'IN' | 'OUT'>('IN');
  const [exchangeVol, setExchangeVol] = useState('รับน้ำเข้า 30 ซม.');

  if (!actionType) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (actionType === 'water') {
      onSaveWater(selectedPondId, {
        do: doVal ? parseFloat(doVal) : undefined,
        ph: phVal ? parseFloat(phVal) : undefined,
        salinity: salinityVal ? parseFloat(salinityVal) : undefined,
        temp: tempVal ? parseFloat(tempVal) : undefined,
        notes: waterNotes || undefined,
      });
    } else if (actionType === 'finance') {
      const parsedAmount = parseFloat(amount);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        onSaveFinance({
          type: financeType,
          category,
          amount: parsedAmount,
          pondId: selectedPondId || undefined,
          note: financeNote || undefined,
        });
      }
    } else if (actionType === 'observation') {
      onSaveWater(selectedPondId, {
        notes: observationText,
      });
    } else if (actionType === 'exchange') {
      onSaveWater(selectedPondId, {
        notes: `ถ่ายน้ำ: ${exchangeType === 'IN' ? 'สูบเข้า' : 'ปล่อยออก'} (${exchangeVol})`,
      });
    }
    onClose();
  };

  const getTitle = () => {
    switch (actionType) {
      case 'water':
        return '💧 บันทึกค่าน้ำ';
      case 'observation':
        return '👁️ บันทึกการสังเกตกุ้ง/ปู';
      case 'finance':
        return '💰 บันทึกรายรับ-รายจ่าย';
      case 'exchange':
        return '🔄 บันทึกการถ่ายน้ำ';
      default:
        return 'บันทึกข้อมูล';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <h3 className="text-xl font-bold text-slate-900">{getTitle()}</h3>
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
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              เลือกบ่อที่ต้องการบันทึก
            </label>
            <select
              value={selectedPondId}
              onChange={(e) => setSelectedPondId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-base focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            >
              {ponds.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.status === 'RESTING' ? '(พักบ่อ)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Form Content by Type */}
          {actionType === 'water' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                * หากไม่ได้ตรวจวัดค่าใด สามารถเว้นว่างไว้ได้ (ระบบจะไม่บังคับใส่ข้อมูล)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    DO ออกซิเจน (mg/L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="เช่น 4.5"
                    value={doVal}
                    onChange={(e) => setDoVal(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    pH กรด-ด่าง (0-14)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="เช่น 7.8"
                    value={phVal}
                    onChange={(e) => setPhVal(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ความเค็ม (ppt)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="เช่น 18.0"
                    value={salinityVal}
                    onChange={(e) => setSalinityVal(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    อุณหภูมิ (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="เช่น 29.5"
                    value={tempVal}
                    onChange={(e) => setTempVal(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมายเหตุ / สภาพสีน้ำ
                </label>
                <input
                  type="text"
                  placeholder="เช่น น้ำเขียวมะกอกใส กุ้งกินอาหารดี"
                  value={waterNotes}
                  onChange={(e) => setWaterNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base"
                />
              </div>
            </div>
          )}

          {actionType === 'finance' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFinanceType('INCOME');
                    setCategory('ขายกุ้ง');
                  }}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm cursor-pointer border ${
                    financeType === 'INCOME'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  + รายรับ (ขายผลผลิต)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFinanceType('EXPENSE');
                    setCategory('ค่าน้ำมันเครื่องสูบ');
                  }}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm cursor-pointer border ${
                    financeType === 'EXPENSE'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  - รายจ่าย (ต้นทุน)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมวดหมู่รายการ
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  จำนวนเงิน (บาท)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  บันทึกเพิ่มเติม (ถ้ามี)
                </label>
                <input
                  type="text"
                  placeholder="เช่น ส่งแพเจ๊นา ขนาด 40 ตัว/กก."
                  value={financeNote}
                  onChange={(e) => setFinanceNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base"
                />
              </div>
            </div>
          )}

          {actionType === 'observation' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สิ่งที่สังเกตเห็น
                </label>
                <textarea
                  rows={3}
                  value={observationText}
                  onChange={(e) => setObservationText(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base"
                />
              </div>
            </div>
          )}

          {actionType === 'exchange' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setExchangeType('IN')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm cursor-pointer border ${
                    exchangeType === 'IN'
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  สูบน้ำเข้าบ่อ
                </button>
                <button
                  type="button"
                  onClick={() => setExchangeType('OUT')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm cursor-pointer border ${
                    exchangeType === 'OUT'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  ปล่อยน้ำออกจากบ่อ
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ปริมาณน้ำ / ระดับน้ำ
                </label>
                <input
                  type="text"
                  value={exchangeVol}
                  onChange={(e) => setExchangeVol(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base"
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
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
              <span>บันทึกข้อมูล</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
