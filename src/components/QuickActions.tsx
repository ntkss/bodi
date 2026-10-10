import React from 'react';
import { Droplet, Eye, CircleDollarSign, ArrowLeftRight } from 'lucide-react';

interface QuickActionsProps {
  onActionClick: (action: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick }) => {
  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
        <span>บันทึกด่วนประจำวัน</span>
        <span className="text-xs font-normal text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
          กดง่ายใน 5 วินาที
        </span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onActionClick('water')}
          type="button"
          className="flex flex-col items-center justify-center p-4 bg-sky-50 hover:bg-sky-100 border-2 border-sky-300 active:bg-sky-200 rounded-2xl shadow-sm text-sky-900 transition-colors text-center cursor-pointer min-h-[96px]"
        >
          <Droplet className="w-8 h-8 text-sky-600 mb-1.5 stroke-[2.2]" />
          <span className="font-bold text-base sm:text-lg leading-tight">
            บันทึกค่าน้ำ
          </span>
          <span className="text-xs text-sky-700 mt-0.5 font-normal">
            DO, pH, เค็ม, อุณหภูมิ
          </span>
        </button>

        <button
          onClick={() => onActionClick('observation')}
          type="button"
          className="flex flex-col items-center justify-center p-4 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 active:bg-amber-200 rounded-2xl shadow-sm text-amber-900 transition-colors text-center cursor-pointer min-h-[96px]"
        >
          <Eye className="w-8 h-8 text-amber-600 mb-1.5 stroke-[2.2]" />
          <span className="font-bold text-base sm:text-lg leading-tight">
            สังเกตกุ้ง/ปู
          </span>
          <span className="text-xs text-amber-700 mt-0.5 font-normal">พฤติกรรม, ตาย</span>
        </button>

        <button
          onClick={() => onActionClick('finance')}
          type="button"
          className="flex flex-col items-center justify-center p-4 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 active:bg-emerald-200 rounded-2xl shadow-sm text-emerald-900 transition-colors text-center cursor-pointer min-h-[96px]"
        >
          <CircleDollarSign className="w-8 h-8 text-emerald-600 mb-1.5 stroke-[2.2]" />
          <span className="font-bold text-base sm:text-lg leading-tight">
            บันทึกการเงิน
          </span>
          <span className="text-xs text-emerald-700 mt-0.5 font-normal">
            รายรับ / รายจ่าย
          </span>
        </button>

        <button
          onClick={() => onActionClick('exchange')}
          type="button"
          className="flex flex-col items-center justify-center p-4 bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-300 active:bg-indigo-200 rounded-2xl shadow-sm text-indigo-900 transition-colors text-center cursor-pointer min-h-[96px]"
        >
          <ArrowLeftRight className="w-8 h-8 text-indigo-600 mb-1.5 stroke-[2.2]" />
          <span className="font-bold text-base sm:text-lg leading-tight">
            บันทึกถ่ายน้ำ
          </span>
          <span className="text-xs text-indigo-700 mt-0.5 font-normal">
            สูบเข้า / ปล่อยออก
          </span>
        </button>
      </div>
    </section>
  );
};
