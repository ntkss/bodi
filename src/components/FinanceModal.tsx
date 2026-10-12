import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Pond, FinanceTransaction } from '../types';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../lib/finance';
import { BottomSheet } from './BottomSheet';

interface FinanceModalProps {
  isOpen: boolean;
  ponds: Pond[];
  transactionToEdit?: FinanceTransaction | null;
  initialType?: 'INCOME' | 'EXPENSE';
  onClose: () => void;
  onSave: (data: {
    id?: string;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    amount: number;
    occurredAt?: string;
    pondId?: string;
    note?: string;
  }) => void;
}

export const FinanceModal: React.FC<FinanceModalProps> = ({
  isOpen,
  ponds,
  transactionToEdit,
  initialType = 'INCOME',
  onClose,
  onSave,
}) => {
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>(initialType);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [pondId, setPondId] = useState<string>('');
  const [occurredAt, setOccurredAt] = useState<string>('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setCategory(transactionToEdit.category);
      setAmount(String(transactionToEdit.amount));
      setPondId(transactionToEdit.pondId || '');
      setOccurredAt(
        transactionToEdit.occurredAt
          ? new Date(transactionToEdit.occurredAt).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );
      setNote(transactionToEdit.note || '');
    } else {
      setType(initialType);
      setCategory(
        initialType === 'INCOME'
          ? DEFAULT_INCOME_CATEGORIES[0]
          : DEFAULT_EXPENSE_CATEGORIES[0]
      );
      setAmount('');
      setPondId('');
      setOccurredAt(new Date().toISOString().slice(0, 10));
      setNote('');
    }
  }, [transactionToEdit, initialType, isOpen]);

  if (!isOpen) return null;

  const isEditing = Boolean(transactionToEdit);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (!category.trim()) return;

    onSave({
      id: transactionToEdit?.id,
      type,
      category: category.trim(),
      amount: parsedAmount,
      occurredAt: occurredAt
        ? new Date(occurredAt).toISOString()
        : new Date().toISOString(),
      pondId: pondId || undefined,
      note: note.trim() || undefined,
    });
    onClose();
  };

  const currentCategoryPresets =
    type === 'INCOME' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? '✏️ แก้ไขรายการการเงิน' : '💰 บันทึกรายรับ-รายจ่าย'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
          {/* Income / Expense Switch */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setType('INCOME');
                if (!isEditing) setCategory(DEFAULT_INCOME_CATEGORIES[0]);
              }}
              className={`flex-1 py-3 rounded-xl font-bold text-sm cursor-pointer border transition-all ${
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              + รายรับ (ขายผลผลิต)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('EXPENSE');
                if (!isEditing) setCategory(DEFAULT_EXPENSE_CATEGORIES[0]);
              }}
              className={`flex-1 py-3 rounded-xl font-bold text-sm cursor-pointer border transition-all ${
                type === 'EXPENSE'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              - รายจ่าย (ต้นทุนฟาร์ม)
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              จำนวนเงิน (บาท) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-xl sm:text-2xl font-bold text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-hidden"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หมวดหมู่รายการ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="ระบุหรือเลือกหมวดหมู่"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base mb-2"
            />
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              {currentCategoryPresets.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    category === cat
                      ? 'bg-sky-100 border-sky-400 text-sky-900 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Pond */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่เกิดรายการ
              </label>
              <input
                type="date"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                บ่อที่เกี่ยวข้อง (ไม่บังคับ)
              </label>
              <select
                value={pondId}
                onChange={(e) => setPondId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              >
                <option value="">บัญชีส่วนกลางฟาร์ม (ไม่ระบุบ่อ)</option>
                {ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              บันทึกช่วยจำ (ไม่บังคับ)
            </label>
            <input
              type="text"
              placeholder="เช่น ส่งแพเจ๊นา, ดีเซลเครื่อง 8 นิ้ว 100 ลิตร"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base"
            />
          </div>

          {/* Footer Actions */}
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
              className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}</span>
            </button>
          </div>
        </form>
      </BottomSheet>
  );
};
