import React, { useState } from 'react';
import { Header } from './components/Header';
import { AlertBanner } from './components/AlertBanner';
import { SystemFoundationCard } from './components/SystemFoundationCard';
import { QuickActions } from './components/QuickActions';
import { FinanceSummaryCard } from './components/FinanceSummaryCard';
import { PondCard } from './components/PondCard';
import { QuickRecordModal } from './components/QuickRecordModal';
import {
  initialFarm,
  initialPonds,
  initialTransactions,
  initialAlerts,
} from './lib/mockData';
import { calculateFinanceSummary } from './lib/finance';
import { Pond, FinanceTransaction, Alert } from './types';
import { Fish, Plus, Check } from 'lucide-react';

export const App: React.FC = () => {
  const [farm] = useState(initialFarm);
  const [ponds, setPonds] = useState<Pond[]>(initialPonds);
  const [transactions, setTransactions] =
    useState<FinanceTransaction[]>(initialTransactions);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [activeModalAction, setActiveModalAction] = useState<string | null>(null);
  const [selectedPondId, setSelectedPondId] = useState<string | undefined>(undefined);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDismissAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'REVIEWED' as const } : a))
    );
    showToast('รับทราบการแจ้งเตือนเรียบร้อยแล้ว');
  };

  const handleQuickAction = (action: string) => {
    setSelectedPondId(undefined);
    setActiveModalAction(action);
  };

  const handleRecordForPond = (pondId: string) => {
    setSelectedPondId(pondId);
    setActiveModalAction('water');
  };

  const handleSaveWater = (
    pondId: string,
    data: { do?: number; ph?: number; salinity?: number; temp?: number; notes?: string }
  ) => {
    setPonds((prev) =>
      prev.map((p) => {
        if (p.id !== pondId) return p;
        return {
          ...p,
          latestLog: {
            id: `log-${Date.now()}`,
            pondId,
            type: 'WATER_QUALITY',
            recordedAt: new Date().toISOString(),
            dissolvedOxygen: data.do ?? p.latestLog?.dissolvedOxygen ?? null,
            ph: data.ph ?? p.latestLog?.ph ?? null,
            salinity: data.salinity ?? p.latestLog?.salinity ?? null,
            temperature: data.temp ?? p.latestLog?.temperature ?? null,
            notes: data.notes ?? p.latestLog?.notes ?? null,
          },
        };
      })
    );
    showToast('บันทึกข้อมูลเรียบร้อยแล้ว');
  };

  const handleSaveFinance = (data: {
    type: 'INCOME' | 'EXPENSE';
    category: string;
    amount: number;
    pondId?: string;
    note?: string;
  }) => {
    const targetPond = ponds.find((p) => p.id === data.pondId);
    const newTx: FinanceTransaction = {
      id: `tx-${Date.now()}`,
      farmId: farm.id,
      pondId: data.pondId,
      pondName: targetPond ? targetPond.name.split(' ')[0] : undefined,
      type: data.type,
      category: data.category,
      amount: data.amount,
      occurredAt: new Date().toISOString(),
      note: data.note,
    };
    setTransactions((prev) => [newTx, ...prev]);
    showToast(
      `บันทึก${data.type === 'INCOME' ? 'รายรับ' : 'รายจ่าย'} ${data.amount.toLocaleString('th-TH')} บาท เรียบร้อยแล้ว`
    );
  };

  const financeSummary = calculateFinanceSummary(transactions);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-thai">
      {/* Top Header */}
      <Header farmName={farm.name} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 sm:py-6">
        {/* Toast Notification */}
        {notification && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-bounce">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium">{notification}</span>
          </div>
        )}

        {/* In-app Attention Alerts */}
        <AlertBanner alerts={alerts} onDismiss={handleDismissAlert} />

        {/* Milestone 1 System Foundation Architecture Card */}
        <SystemFoundationCard />

        {/* Quick Daily Actions */}
        <QuickActions onActionClick={handleQuickAction} />

        {/* Finance Summary */}
        <FinanceSummaryCard summary={financeSummary} />

        {/* Pond Status & Latest Water Log Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Fish className="w-5 h-5 text-sky-700" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                สถานะบ่อเลี้ยง ({ponds.length} บ่อ)
              </h2>
            </div>
            <button
              onClick={() => showToast('ฟังก์ชันเพิ่มบ่อจะพร้อมใช้งานใน Milestone 2')}
              type="button"
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-900 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มบ่อใหม่</span>
            </button>
          </div>

          <div className="space-y-4">
            {ponds.map((pond) => (
              <PondCard key={pond.id} pond={pond} onRecordClick={handleRecordForPond} />
            ))}
          </div>
        </section>
      </main>

      {/* Record Entry Modal */}
      <QuickRecordModal
        actionType={activeModalAction}
        initialPondId={selectedPondId}
        ponds={ponds}
        onClose={() => setActiveModalAction(null)}
        onSaveWater={handleSaveWater}
        onSaveFinance={handleSaveFinance}
      />

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-4xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700">
            บ่อดี (BODI) — Lean Smart Aquaculture MVP
          </p>
          <p>สโลแกน: รู้ทันบ่อ ดูแลง่าย ขายได้ราคา | เขตเวลา: Asia/Bangkok</p>
          <p className="text-[11px] text-slate-400">
            สร้างขึ้นเพื่อฟาร์มกุ้ง ปู และสัตว์น้ำครอบครัว แบบธรรมชาติและกึ่งธรรมชาติ
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
