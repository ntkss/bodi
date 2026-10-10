import React, { useState, useMemo } from 'react';
import {
  Plus,
  Download,
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  Calendar,
  Wallet,
  FileSpreadsheet,
} from 'lucide-react';
import { FinanceTransaction } from '../types';
import {
  calculateFinanceSummary,
  formatBaht,
  generateTransactionsCSV,
} from '../lib/finance';
import { formatThaiDateTime } from '../lib/date';

interface FinanceViewProps {
  transactions: FinanceTransaction[];
  onAddTransaction: (type?: 'INCOME' | 'EXPENSE') => void;
  onEditTransaction: (tx: FinanceTransaction) => void;
  onDeleteTransaction: (txId: string) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // Derive unique months available in transactions (YYYY-MM)
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.occurredAt) {
        const d = new Date(tx.occurredAt);
        const m = (d.getMonth() + 1).toString().padStart(2, '0');
        monthsSet.add(`${d.getFullYear()}-${m}`);
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Filter by type
      if (filterType !== 'ALL' && tx.type !== filterType) {
        return false;
      }
      // Filter by month
      if (selectedMonth !== 'ALL' && tx.occurredAt) {
        const d = new Date(tx.occurredAt);
        const m = (d.getMonth() + 1).toString().padStart(2, '0');
        const ym = `${d.getFullYear()}-${m}`;
        if (ym !== selectedMonth) return false;
      }
      return true;
    });
  }, [transactions, filterType, selectedMonth]);

  const summary = calculateFinanceSummary(filteredTransactions);
  const isPositive = summary.netProfit >= 0;

  // Handle CSV export
  const handleExportCSV = () => {
    const csvData = generateTransactionsCSV(filteredTransactions);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bodi_finance_${selectedMonth || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatMonthLabel = (ym: string) => {
    const [year, month] = ym.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-600" />
            <span>บัญชีฟาร์ม (รายรับ-รายจ่าย)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            บันทึกต้นทุนและยอดขายอย่างง่าย ชัดเจน ไม่ซับซ้อน
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={handleExportCSV}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            title="ส่งออกไฟล์ CSV ไปยัง Excel"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก CSV</span>
          </button>
          <button
            onClick={() => onAddTransaction()}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ บันทึกรายการ</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Income Card */}
        <div className="bg-white rounded-2xl border-2 border-emerald-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">รายรับรวม</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-950 mt-1">
            {formatBaht(summary.totalIncome)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {filteredTransactions.filter((t) => t.type === 'INCOME').length} รายการ
          </span>
        </div>

        {/* Expense Card */}
        <div className="bg-white rounded-2xl border-2 border-rose-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800">รายจ่ายรวม</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-950 mt-1">
            {formatBaht(summary.totalExpense)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {filteredTransactions.filter((t) => t.type === 'EXPENSE').length} รายการ
          </span>
        </div>

        {/* Net Profit Card */}
        <div
          className={`bg-white rounded-2xl border-2 p-4 shadow-2xs ${
            isPositive ? 'border-sky-200' : 'border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              คงเหลือสุทธิ (ประมาณการ)
            </span>
          </div>
          <p
            className={`text-2xl font-bold mt-1 ${
              isPositive ? 'text-sky-900' : 'text-rose-700'
            }`}
          >
            {formatBaht(summary.netProfit)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            * คำนวณตามรายการที่บันทึกจริง
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Type Filter */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('INCOME')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'INCOME'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เฉพาะรายรับ
          </button>
          <button
            type="button"
            onClick={() => setFilterType('EXPENSE')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'EXPENSE'
                ? 'bg-white text-rose-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เฉพาะรายจ่าย
          </button>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-slate-600 font-medium">รอบเดือน:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
          >
            <option value="ALL">ทุกช่วงเวลา</option>
            {availableMonths.map((ym) => (
              <option key={ym} value={ym}>
                {formatMonthLabel(ym)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
          <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="font-bold text-slate-700 text-base">
            ยังไม่มีรายการการเงินตามเงื่อนไขนี้
          </h4>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            เริ่มบันทึกยอดขายผลผลิต หรือค่าใช้จ่ายน้ำมัน/อาหารเพื่อดูสรุปบัญชี
          </p>
          <button
            type="button"
            onClick={() => onAddTransaction()}
            className="mt-4 px-4 py-2 bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            + บันทึกรายการแรก
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTransactions.map((tx) => {
            const isIncome = tx.type === 'INCOME';

            return (
              <div
                key={tx.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left: Info & Category */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isIncome
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {isIncome ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-base text-slate-900">
                        {tx.category}
                      </h4>
                      {tx.pondName && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {tx.pondName}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-x-2">
                      <span>{formatThaiDateTime(tx.occurredAt || new Date())}</span>
                      {tx.note && <span className="text-slate-600">• {tx.note}</span>}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span
                    className={`text-lg sm:text-xl font-bold ${
                      isIncome ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatBaht(tx.amount)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditTransaction(tx)}
                      className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="แก้ไขรายการ"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => tx.id && onDeleteTransaction(tx.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="ลบรายการ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
