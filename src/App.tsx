import React, { useState } from 'react';
import { Header, AppTab } from './components/Header';
import { AlertBanner } from './components/AlertBanner';
import { SystemFoundationCard } from './components/SystemFoundationCard';
import { QuickActions } from './components/QuickActions';
import { FinanceSummaryCard } from './components/FinanceSummaryCard';
import { RecentObservationsCard } from './components/RecentObservationsCard';
import { FinanceView } from './components/FinanceView';
import { FinanceModal } from './components/FinanceModal';
import { PondCard } from './components/PondCard';
import { PondModal } from './components/PondModal';
import { DailyLogModal } from './components/DailyLogModal';
import { PondDetailView } from './components/PondDetailView';
import { ConfirmDialog } from './components/ConfirmDialog';
import {
  initialFarm,
  initialPonds,
  initialLogs,
  initialTransactions,
  initialAlerts,
} from './lib/mockData';
import { calculateFinanceSummary } from './lib/finance';
import { Pond, PondLog, PondStatus, LogType, FinanceTransaction, Alert } from './types';
import { Fish, Plus, Check } from 'lucide-react';

export const App: React.FC = () => {
  const [farm] = useState(initialFarm);
  const [activeTab, setActiveTab] = useState<AppTab>('DASHBOARD');

  // Domain state
  const [ponds, setPonds] = useState<Pond[]>(initialPonds);
  const [logs, setLogs] = useState<PondLog[]>(initialLogs);
  const [transactions, setTransactions] =
    useState<FinanceTransaction[]>(initialTransactions);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);

  // Selected Pond for detail view
  const [selectedPondDetailId, setSelectedPondDetailId] = useState<string | null>(null);

  // Pond modal
  const [isPondModalOpen, setIsPondModalOpen] = useState(false);
  const [pondToEdit, setPondToEdit] = useState<Pond | null>(null);

  // Daily log modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logToEdit, setLogToEdit] = useState<PondLog | null>(null);
  const [logModalPondId, setLogModalPondId] = useState<string>('');
  const [logModalInitialType, setLogModalInitialType] =
    useState<LogType>('WATER_QUALITY');

  // Finance modal
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [financeToEdit, setFinanceToEdit] = useState<FinanceTransaction | null>(null);
  const [financeInitialType, setFinanceInitialType] = useState<'INCOME' | 'EXPENSE'>(
    'INCOME'
  );

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3500);
  };

  // Dismiss alert
  const handleDismissAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'REVIEWED' as const } : a))
    );
    showToast('รับทราบการแจ้งเตือนเรียบร้อยแล้ว');
  };

  // Helper to get latest log for pond
  const getLatestLogForPond = (pondId: string, currentLogs: PondLog[]) => {
    const pondLogsSorted = currentLogs
      .filter((l) => l.pondId === pondId)
      .sort(
        (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      );
    return pondLogsSorted[0] || undefined;
  };

  // --- Pond CRUD ---
  const handleOpenCreatePond = () => {
    setPondToEdit(null);
    setIsPondModalOpen(true);
  };

  const handleOpenEditPond = (pond: Pond) => {
    setPondToEdit(pond);
    setIsPondModalOpen(true);
  };

  const handleSavePond = (pondData: {
    id?: string;
    name: string;
    area?: number;
    waterSource?: string;
    species?: string;
    farmingMethod?: string;
    status: PondStatus;
    notes?: string;
  }) => {
    if (pondData.id) {
      setPonds((prev) =>
        prev.map((p) =>
          p.id === pondData.id
            ? {
                ...p,
                name: pondData.name,
                area: pondData.area,
                waterSource: pondData.waterSource,
                species: pondData.species,
                farmingMethod: pondData.farmingMethod,
                status: pondData.status,
                notes: pondData.notes,
              }
            : p
        )
      );
      showToast(`แก้ไขข้อมูล "${pondData.name}" เรียบร้อยแล้ว`);
    } else {
      const newPond: Pond = {
        id: `pond-${Date.now()}`,
        farmId: farm.id,
        name: pondData.name,
        area: pondData.area,
        waterSource: pondData.waterSource,
        species: pondData.species,
        farmingMethod: pondData.farmingMethod,
        status: pondData.status,
        notes: pondData.notes,
        latestLog: undefined,
      };
      setPonds((prev) => [...prev, newPond]);
      showToast(`สร้างบ่อใหม่ "${pondData.name}" สำเร็จแล้ว`);
    }
    setIsPondModalOpen(false);
  };

  const handleDeletePond = (pondId: string) => {
    const targetPond = ponds.find((p) => p.id === pondId);
    setConfirmDialog({
      isOpen: true,
      title: 'ยืนยันการลบบ่อเลี้ยง',
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบ "${targetPond?.name || 'บ่อนี้'}"? ข้อมูลบันทึกและประวัติทั้งหมดของบ่อนี้จะถูกลบไปด้วย`,
      onConfirm: () => {
        setPonds((prev) => prev.filter((p) => p.id !== pondId));
        setLogs((prev) => prev.filter((l) => l.pondId !== pondId));
        if (selectedPondDetailId === pondId) {
          setSelectedPondDetailId(null);
        }
        setIsPondModalOpen(false);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast('ลบบ่อเรียบร้อยแล้ว');
      },
    });
  };

  // --- Daily Log CRUD ---
  const handleOpenAddLog = (pondId?: string, initialType: LogType = 'WATER_QUALITY') => {
    setLogToEdit(null);
    setLogModalPondId(pondId || ponds[0]?.id || '');
    setLogModalInitialType(initialType);
    setIsLogModalOpen(true);
  };

  const handleOpenEditLog = (log: PondLog) => {
    setLogToEdit(log);
    setLogModalPondId(log.pondId);
    setLogModalInitialType(log.type);
    setIsLogModalOpen(true);
  };

  const handleSaveLog = (logData: {
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
  }) => {
    let updatedLogs: PondLog[];

    if (logData.id) {
      updatedLogs = logs.map((l) =>
        l.id === logData.id
          ? {
              ...l,
              pondId: logData.pondId,
              type: logData.type,
              temperature: logData.temperature,
              ph: logData.ph,
              salinity: logData.salinity,
              dissolvedOxygen: logData.dissolvedOxygen,
              exchangeType: logData.exchangeType,
              exchangeVolume: logData.exchangeVolume,
              observation: logData.observation,
              mortalityCount: logData.mortalityCount,
              harvestQuantity: logData.harvestQuantity,
              harvestUnit: logData.harvestUnit,
              harvestPrice: logData.harvestPrice,
              notes: logData.notes,
            }
          : l
      );
      showToast('แก้ไขบันทึกข้อผิดพลาดเรียบร้อยแล้ว');
    } else {
      const newLog: PondLog = {
        id: `log-${Date.now()}`,
        pondId: logData.pondId,
        type: logData.type,
        recordedAt: logData.recordedAt || new Date().toISOString(),
        temperature: logData.temperature,
        ph: logData.ph,
        salinity: logData.salinity,
        dissolvedOxygen: logData.dissolvedOxygen,
        exchangeType: logData.exchangeType,
        exchangeVolume: logData.exchangeVolume,
        observation: logData.observation,
        mortalityCount: logData.mortalityCount,
        harvestQuantity: logData.harvestQuantity,
        harvestUnit: logData.harvestUnit,
        harvestPrice: logData.harvestPrice,
        notes: logData.notes,
      };
      updatedLogs = [newLog, ...logs];
      showToast('เพิ่มบันทึกข้อมูลเรียบร้อยแล้ว');
    }

    setLogs(updatedLogs);

    // Sync latestLog on pond
    setPonds((prev) =>
      prev.map((p) => {
        if (p.id === logData.pondId) {
          return {
            ...p,
            latestLog: getLatestLogForPond(p.id, updatedLogs),
          };
        }
        return p;
      })
    );
  };

  const handleDeleteLog = (logId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'ยืนยันการลบบันทึก',
      message: 'คุณแน่ใจหรือไม่ว่าต้องการลบบันทึกรายการนี้?',
      onConfirm: () => {
        const targetLog = logs.find((l) => l.id === logId);
        const updatedLogs = logs.filter((l) => l.id !== logId);
        setLogs(updatedLogs);

        if (targetLog) {
          setPonds((prev) =>
            prev.map((p) => {
              if (p.id === targetLog.pondId) {
                return {
                  ...p,
                  latestLog: getLatestLogForPond(p.id, updatedLogs),
                };
              }
              return p;
            })
          );
        }

        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast('ลบบันทึกเรียบร้อยแล้ว');
      },
    });
  };

  // --- Finance CRUD ---
  const handleOpenAddFinance = (type: 'INCOME' | 'EXPENSE' = 'INCOME') => {
    setFinanceToEdit(null);
    setFinanceInitialType(type);
    setIsFinanceModalOpen(true);
  };

  const handleOpenEditFinance = (tx: FinanceTransaction) => {
    setFinanceToEdit(tx);
    setFinanceInitialType(tx.type);
    setIsFinanceModalOpen(true);
  };

  const handleSaveFinance = (data: {
    id?: string;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    amount: number;
    occurredAt?: string;
    pondId?: string;
    note?: string;
  }) => {
    const targetPond = ponds.find((p) => p.id === data.pondId);

    if (data.id) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === data.id
            ? {
                ...t,
                type: data.type,
                category: data.category,
                amount: data.amount,
                occurredAt: data.occurredAt || t.occurredAt,
                pondId: data.pondId,
                pondName: targetPond ? targetPond.name.split(' ')[0] : undefined,
                note: data.note,
              }
            : t
        )
      );
      showToast('แก้ไขรายการการเงินเรียบร้อยแล้ว');
    } else {
      const newTx: FinanceTransaction = {
        id: `tx-${Date.now()}`,
        farmId: farm.id,
        pondId: data.pondId,
        pondName: targetPond ? targetPond.name.split(' ')[0] : undefined,
        type: data.type,
        category: data.category,
        amount: data.amount,
        occurredAt: data.occurredAt || new Date().toISOString(),
        note: data.note,
      };
      setTransactions((prev) => [newTx, ...prev]);
      showToast(
        `บันทึก${data.type === 'INCOME' ? 'รายรับ' : 'รายจ่าย'} ${data.amount.toLocaleString('th-TH')} บาท เรียบร้อยแล้ว`
      );
    }
    setIsFinanceModalOpen(false);
  };

  const handleDeleteFinance = (txId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'ยืนยันการลบรายการการเงิน',
      message: 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?',
      onConfirm: () => {
        setTransactions((prev) => prev.filter((t) => t.id !== txId));
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast('ลบรายการการเงินเรียบร้อยแล้ว');
      },
    });
  };

  // Quick Action routing from Home Dashboard
  const handleQuickActionClick = (action: string) => {
    if (action === 'water') {
      handleOpenAddLog(undefined, 'WATER_QUALITY');
    } else if (action === 'observation') {
      handleOpenAddLog(undefined, 'ANIMAL_OBSERVATION');
    } else if (action === 'exchange') {
      handleOpenAddLog(undefined, 'WATER_EXCHANGE');
    } else if (action === 'finance') {
      handleOpenAddFinance('INCOME');
    }
  };

  const financeSummary = calculateFinanceSummary(transactions);
  const activePondForDetail = ponds.find((p) => p.id === selectedPondDetailId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-thai selection:bg-sky-200">
      {/* Top Header with navigation tabs */}
      <Header
        farmName={farm.name}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'PONDS') setSelectedPondDetailId(null);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 sm:py-6">
        {/* Toast Notification */}
        {notification && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-bounce">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium">{notification}</span>
          </div>
        )}

        {/* In-app Attention Alerts (Visible across sections) */}
        <AlertBanner alerts={alerts} onDismiss={handleDismissAlert} />

        {/* TAB 1: HOME DASHBOARD */}
        {activeTab === 'DASHBOARD' && (
          <div>
            {/* 1. Large Quick Actions */}
            <QuickActions onActionClick={handleQuickActionClick} />

            {/* 2. Monthly Finance Summary Card (Clickable to switch to Finance tab) */}
            <div
              className="cursor-pointer group"
              onClick={() => setActiveTab('FINANCE')}
              title="กดเพื่อดูรายละเอียดบัญชีฟาร์ม"
            >
              <FinanceSummaryCard summary={financeSummary} />
            </div>

            {/* 3. Recent Observations & Mortality Card */}
            <RecentObservationsCard
              logs={logs}
              ponds={ponds}
              onAddObservation={() => handleOpenAddLog(undefined, 'ANIMAL_OBSERVATION')}
            />

            {/* 4. Latest Water Reading per Pond */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Fish className="w-5 h-5 text-sky-700" />
                  <h2 className="text-lg font-bold text-slate-800">
                    สภาพน้ำล่าสุดของแต่ละบ่อ ({ponds.length} บ่อ)
                  </h2>
                </div>
                <button
                  onClick={() => setActiveTab('PONDS')}
                  type="button"
                  className="text-xs font-semibold text-sky-700 hover:text-sky-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  ดูทั้งหมด →
                </button>
              </div>

              <div className="space-y-3">
                {ponds.map((pond) => (
                  <PondCard
                    key={pond.id}
                    pond={pond}
                    onRecordClick={(pondId) => handleOpenAddLog(pondId, 'WATER_QUALITY')}
                    onViewDetail={(pondId) => {
                      setSelectedPondDetailId(pondId);
                      setActiveTab('PONDS');
                    }}
                    onEditPond={handleOpenEditPond}
                  />
                ))}
              </div>
            </section>

            {/* 5. System Foundation Card */}
            <SystemFoundationCard />
          </div>
        )}

        {/* TAB 2: PONDS MANAGEMENT */}
        {activeTab === 'PONDS' && (
          <div>
            {selectedPondDetailId && activePondForDetail ? (
              <PondDetailView
                pond={activePondForDetail}
                logs={logs}
                onBack={() => setSelectedPondDetailId(null)}
                onEditPond={handleOpenEditPond}
                onAddLog={(pondId, initialType) => handleOpenAddLog(pondId, initialType)}
                onEditLog={handleOpenEditLog}
                onDeleteLog={handleDeleteLog}
              />
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Fish className="w-6 h-6 text-sky-700" />
                    <h2 className="text-xl font-bold text-slate-900">
                      จัดการบ่อเลี้ยง ({ponds.length} บ่อ)
                    </h2>
                  </div>
                  <button
                    onClick={handleOpenCreatePond}
                    type="button"
                    className="flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ เพิ่มบ่อใหม่</span>
                  </button>
                </div>

                {ponds.length === 0 ? (
                  <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                    <Fish className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-700 text-base">
                      ยังไม่มีบ่อในฟาร์ม
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      กดปุ่มด้านล่างเพื่อสร้างบ่อเลี้ยงแรกของฟาร์มคุณ
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenCreatePond}
                      className="mt-4 px-4 py-2 bg-sky-700 text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-sky-800 transition-colors cursor-pointer"
                    >
                      + สร้างบ่อแรก
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ponds.map((pond) => (
                      <PondCard
                        key={pond.id}
                        pond={pond}
                        onRecordClick={(pondId) =>
                          handleOpenAddLog(pondId, 'WATER_QUALITY')
                        }
                        onViewDetail={(pondId) => setSelectedPondDetailId(pondId)}
                        onEditPond={handleOpenEditPond}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FINANCE & ACCOUNTING */}
        {activeTab === 'FINANCE' && (
          <FinanceView
            transactions={transactions}
            onAddTransaction={(type) => handleOpenAddFinance(type || 'INCOME')}
            onEditTransaction={handleOpenEditFinance}
            onDeleteTransaction={handleDeleteFinance}
          />
        )}
      </main>

      {/* Pond Modal */}
      <PondModal
        isOpen={isPondModalOpen}
        pondToEdit={pondToEdit}
        onClose={() => setIsPondModalOpen(false)}
        onSave={handleSavePond}
        onDelete={handleDeletePond}
      />

      {/* Daily Log Modal */}
      <DailyLogModal
        isOpen={isLogModalOpen}
        ponds={ponds}
        initialPondId={logModalPondId}
        logToEdit={logToEdit}
        initialType={logModalInitialType}
        onClose={() => setIsLogModalOpen(false)}
        onSave={handleSaveLog}
      />

      {/* Finance Modal */}
      <FinanceModal
        isOpen={isFinanceModalOpen}
        ponds={ponds}
        transactionToEdit={financeToEdit}
        initialType={financeInitialType}
        onClose={() => setIsFinanceModalOpen(false)}
        onSave={handleSaveFinance}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
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
