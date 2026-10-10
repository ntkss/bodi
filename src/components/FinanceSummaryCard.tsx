import React from 'react';
import { FinanceSummary, formatBaht } from '../lib/finance';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface FinanceSummaryCardProps {
  summary: FinanceSummary;
}

export const FinanceSummaryCard: React.FC<FinanceSummaryCardProps> = ({ summary }) => {
  const isPositive = summary.netProfit >= 0;

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-4 sm:p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-sky-700" />
          <h2 className="text-lg font-bold text-slate-800">สรุปการเงินรอบเดือนนี้</h2>
        </div>
        <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
          ยอดรวมบัญชีฟาร์ม
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Income */}
        <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800">รายรับรวม</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-950 mt-1">
            {formatBaht(summary.totalIncome)}
          </p>
        </div>

        {/* Expense */}
        <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-800">รายจ่ายรวม</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-rose-950 mt-1">
            {formatBaht(summary.totalExpense)}
          </p>
        </div>

        {/* Net Profit */}
        <div
          className={`p-3.5 rounded-xl border ${
            isPositive
              ? 'bg-sky-50/80 border-sky-200 text-sky-950'
              : 'bg-amber-50/80 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">
              คงเหลือสุทธิ (ประมาณการ)
            </span>
          </div>
          <p
            className={`text-xl sm:text-2xl font-bold mt-1 ${
              isPositive ? 'text-sky-900' : 'text-rose-700'
            }`}
          >
            {formatBaht(summary.netProfit)}
          </p>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 mt-2 text-right">
        * คำนวณตามรายการที่ลงบันทึกจริง ไม่รวมค่าเสื่อมราคาหรือสินค้าคงค้าง
      </p>
    </div>
  );
};
