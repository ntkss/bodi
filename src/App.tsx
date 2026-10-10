import React, { useState, useEffect, useCallback } from 'react';
import { Header, AppTab } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { AlertBanner } from './components/AlertBanner';
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
import { LoginPage } from './components/LoginPage';
import { useAuth } from './context/AuthContext';
import { calculateFinanceSummary } from './lib/finance';
import {
  registerBodiServiceWorker,
  requestPushPermission,
  getNotificationPermission,
} from './lib/pushNotifications';
import { Pond, PondLog, PondStatus, LogType, FinanceTransaction, Alert } from './types';
import { Fish, Plus, Check, Loader2, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const { user, farm, logout, authFetch, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>('DASHBOARD');

  // Real Database Domain State (Zero Mock Data)
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [logs, setLogs] = useState<PondLog[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isPushEnabled, setIsPushEnabled] = useState<boolean>(false);

  // Selected Pond for detail view
  const [selectedPondDetailId, setSelectedPondDetailId] = useState<string | null>(null);

  // Modals state
  const [isPondModalOpen, setIsPondModalOpen] = useState(false);
  const [pondToEdit, setPondToEdit] = useState<Pond | null>(null);

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logToEdit, setLogToEdit] = useState<PondLog | null>(null);
  const [logModalPondId, setLogModalPondId] = useState<string>('');
  const [logModalInitialType, setLogModalInitialType] =
    useState<LogType>('WATER_QUALITY');

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

  // Load real data from Neon PostgreSQL APIs
  const loadFarmData = useCallback(async () => {
    if (!user) return;
    setIsLoadingData(true);
    try {
      const [pondsRes, logsRes, financeRes, alertsRes] = await Promise.all([
        authFetch('/api/ponds'),
        authFetch('/api/logs'),
        authFetch('/api/finance'),
        authFetch('/api/alerts'),
      ]);

      if (pondsRes.ok) {
        const pondsData = await pondsRes.json();
        setPonds(pondsData);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }
      if (financeRes.ok) {
        const financeData = await financeRes.json();
        setTransactions(financeData);
      }
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData);
      }
    } catch (err) {
      console.error('Failed to load farm data from server:', err);
      showToast('เกิดข้อผิดพลาดในการโหลดข้อมูลฟาร์ม');
    } finally {
      setIsLoadingData(false);
    }
  }, [user, authFetch]);

  // Register PWA Service Worker & detect push permission
  useEffect(() => {
    registerBodiServiceWorker();
    if (getNotificationPermission() === 'granted') {
      setIsPushEnabled(true);
    }
  }, []);

  const handleTogglePush = async () => {
    if (isPushEnabled) {
      showToast('เปิดการแจ้งเตือนสภาวะฟาร์มไว้อยู่แล้ว');
      return;
    }
    const granted = await requestPushPermission();
    if (granted) {
      setIsPushEnabled(true);
      showToast('เปิดรับการแจ้งเตือนสภาวะฟาร์มเรียบร้อย');
    } else {
      showToast('ไม่ได้รับอนุญาตแจ้งเตือน กรุณาเปิดในการตั้งค่าเบราว์เซอร์');
    }
  };

  useEffect(() => {
    if (user) {
      loadFarmData();
    }
  }, [user, loadFarmData]);

  // Alert handlers with API persistence
  const handleReviewAlert = async (id: string) => {
    try {
      const res = await authFetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REVIEWED' }),
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'REVIEWED' as const } : a))
        );
        showToast('รับทราบการแจ้งเตือนแล้ว');
      }
    } catch {
      showToast('ไม่สามารถอัปเดตการแจ้งเตือนได้');
    }
  };

  const handleResolveAlert = async (id: string) => {
    try {
      const res = await authFetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED' }),
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'RESOLVED' as const } : a))
        );
        showToast('ทำเครื่องหมายแก้ไขเรียบร้อย บ่อกลับสู่ภาวะปกติ');
      }
    } catch {
      showToast('ไม่สามารถอัปเดตการแจ้งเตือนได้');
    }
  };

  // --- Pond CRUD with API ---
  const handleOpenCreatePond = () => {
    setPondToEdit(null);
    setIsPondModalOpen(true);
  };

  const handleOpenEditPond = (pond: Pond) => {
    setPondToEdit(pond);
    setIsPondModalOpen(true);
  };

  const handleSavePond = async (pondData: {
    id?: string;
    name: string;
    area?: number;
    waterSource?: string;
    species?: string;
    farmingMethod?: string;
    status: PondStatus;
    notes?: string;
  }) => {
    try {
      const isEdit = Boolean(pondData.id);
      const url = isEdit ? `/api/ponds/${pondData.id}` : '/api/ponds';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...pondData,
          farmId: farm?.id,
        }),
      });

      if (res.ok) {
        await loadFarmData();
        showToast(
          isEdit
            ? `แก้ไขข้อมูล "${pondData.name}" เรียบร้อยแล้ว`
            : `สร้างบ่อใหม่ "${pondData.name}" สำเร็จแล้ว`
        );
        setIsPondModalOpen(false);
      } else {
        const error = await res.json();
        showToast(error.error || 'เกิดข้อผิดพลาดในการบันทึกบ่อ');
      }
    } catch (err) {
      console.error('Error saving pond:', err);
      showToast('เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว');
    }
  };

  const handleDeletePond = (pondId: string) => {
    const targetPond = ponds.find((p) => p.id === pondId);
    setConfirmDialog({
      isOpen: true,
      title: 'ยืนยันการลบบ่อเลี้ยง',
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบ "${targetPond?.name || 'บ่อนี้'}"? ข้อมูลบันทึกและประวัติทั้งหมดของบ่อนี้จะถูกลบไปด้วย`,
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/ponds/${pondId}`, { method: 'DELETE' });
          if (res.ok) {
            await loadFarmData();
            if (selectedPondDetailId === pondId) {
              setSelectedPondDetailId(null);
            }
            setIsPondModalOpen(false);
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
            showToast('ลบบ่อเรียบร้อยแล้ว');
          } else {
            showToast('ไม่สามารถลบบ่อได้');
          }
        } catch {
          showToast('เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว');
        }
      },
    });
  };

  // --- Daily Log CRUD with API ---
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

  const handleSaveLog = async (logData: {
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
    try {
      const isEdit = Boolean(logData.id);
      const url = isEdit ? `/api/logs/${logData.id}` : '/api/logs';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData),
      });

      if (res.ok) {
        await loadFarmData();
        showToast(isEdit ? 'แก้ไขบันทึกเรียบร้อยแล้ว' : 'เพิ่มบันทึกข้อมูลเรียบร้อยแล้ว');
        setIsLogModalOpen(false);
      } else {
        const error = await res.json();
        showToast(error.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch {
      showToast('เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว');
    }
  };

  const handleDeleteLog = (logId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'ยืนยันการลบบันทึก',
      message: 'คุณแน่ใจหรือไม่ว่าต้องการลบบันทึกรายการนี้?',
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/logs/${logId}`, { method: 'DELETE' });
          if (res.ok) {
            await loadFarmData();
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
            showToast('ลบบันทึกเรียบร้อยแล้ว');
          } else {
            showToast('ไม่สามารถลบบันทึกได้');
          }
        } catch {
          showToast('เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว');
        }
      },
    });
  };

  // --- Finance CRUD with API ---
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

  const handleSaveFinance = async (data: {
    id?: string;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    amount: number;
    occurredAt?: string;
    pondId?: string;
    note?: string;
  }) => {
    try {
      const isEdit = Boolean(data.id);
      const url = isEdit ? `/api/finance/${data.id}` : '/api/finance';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          farmId: farm?.id,
        }),
      });

      if (res.ok) {
        await loadFarmData();
        showToast(
          isEdit
            ? 'แก้ไขรายการการเงินเรียบร้อยแล้ว'
            : `บันทึก${data.type === 'INCOME' ? 'รายรับ' : 'รายจ่าย'} ${data.amount.toLocaleString('th-TH')} บาท เรียบร้อยแล้ว`
        );
        setIsFinanceModalOpen(false);
      } else {
        const error = await res.json();
        showToast(error.error || 'เกิดข้อผิดพลาดในการบันทึกการเงิน');
      }
    } catch {
      showToast('เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว');
    }
  };

  const handleDeleteFinance = (txId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'ยืนยันการลบรายการการเงิน',
      message: 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?',
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/finance/${txId}`, { method: 'DELETE' });
          if (res.ok) {
            await loadFarmData();
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
            showToast('ลบรายการการเงินเรียบร้อยแล้ว');
          } else {
            showToast('ไม่สามารถลบรายการได้');
          }
        } catch {
          showToast('เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว');
        }
      },
    });
  };

  // Quick Action routing from Home Dashboard
  const handleQuickActionClick = (action: string) => {
    if (
      ponds.length === 0 &&
      (action === 'water' || action === 'observation' || action === 'exchange')
    ) {
      handleOpenCreatePond();
      showToast('กรุณาสร้างบ่อเลี้ยงแรกก่อนทำการบันทึกข้อมูล');
      return;
    }

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

  // --- Render Authentication Wall ---
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center gap-4 max-w-xs w-full">
          <div className="w-12 h-12 bg-sky-50 text-sky-700 rounded-2xl flex items-center justify-center animate-spin">
            <Loader2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg font-prompt">บ่อดี (BODI)</h3>
            <p className="text-xs text-slate-500 mt-1">กำลังโหลดข้อมูลฟาร์มของคุณ...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Google Authentication Page
  if (!user) {
    return <LoginPage />;
  }

  const financeSummary = calculateFinanceSummary(transactions);
  const activePondForDetail = ponds.find((p) => p.id === selectedPondDetailId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-thai selection:bg-sky-200">
      {/* Top Header with navigation tabs & User Session */}
      <Header
        farmName={farm?.name || `ฟาร์มของ ${user.name}`}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'PONDS') setSelectedPondDetailId(null);
        }}
        user={{
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        }}
        onLogout={logout}
        isPushEnabled={isPushEnabled}
        onTogglePush={handleTogglePush}
      />

      {/* Main Content Area (With safe space for mobile bottom nav) */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 sm:py-6 pb-28 sm:pb-10">
        {/* Toast Notification */}
        {notification && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-bounce">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium">{notification}</span>
          </div>
        )}

        {/* In-app Attention Alerts (Visible across sections) */}
        <AlertBanner
          alerts={alerts}
          onReview={handleReviewAlert}
          onResolve={handleResolveAlert}
        />

        {/* TAB 1: HOME DASHBOARD */}
        {activeTab === 'DASHBOARD' && (
          <div>
            {/* 1. Large Quick Actions */}
            <QuickActions onActionClick={handleQuickActionClick} />

            {/* 2. Monthly Finance Summary Card */}
            <div
              onClick={() => setActiveTab('FINANCE')}
              className="cursor-pointer transition-transform active:scale-[0.99]"
            >
              <FinanceSummaryCard summary={financeSummary} />
            </div>

            {/* 3. Recent Mortality & Observations Card */}
            <RecentObservationsCard
              logs={logs}
              ponds={ponds}
              onAddObservation={() => handleOpenAddLog(undefined, 'ANIMAL_OBSERVATION')}
            />

            {/* 4. Active Ponds Status List or Empty State */}
            <div className="mt-6 mb-8">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Fish className="w-5 h-5 text-sky-700" />
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                    สถานะบ่อเลี้ยงทั้งหมด ({ponds.length} บ่อ)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleOpenCreatePond}
                  className="flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มบ่อ</span>
                </button>
              </div>

              {isLoadingData ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                  <span>กำลังโหลดข้อมูลบ่อ...</span>
                </div>
              ) : ponds.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-base">
                      ยินดีต้อนรับสู่ฟาร์มของคุณ!
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                      ยังไม่มีบ่อเลี้ยงในระบบ เริ่มต้นบันทึกค่าน้ำและประวัติบ่อได้ง่ายๆ
                      เพียงกดปุ่มด้านล่าง
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenCreatePond}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>สร้างบ่อเลี้ยงแรก</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {ponds.map((pond) => (
                    <PondCard
                      key={pond.id}
                      pond={pond}
                      onRecordClick={(pondId) =>
                        handleOpenAddLog(pondId, 'WATER_QUALITY')
                      }
                      onViewDetail={(pondId) => {
                        setSelectedPondDetailId(pondId);
                        setActiveTab('PONDS');
                      }}
                      onEditPond={handleOpenEditPond}
                    />
                  ))}
                </div>
              )}
            </div>
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

                {isLoadingData ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                    <span>กำลังโหลดข้อมูลบ่อ...</span>
                  </div>
                ) : ponds.length === 0 ? (
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
            บ่อดี (BODI) — Lean Smart Aquaculture Web App
          </p>
          <p>สโลแกน: รู้ทันบ่อ ดูแลง่าย ขายได้ราคา | เขตเวลา: Asia/Bangkok</p>
          <p className="text-[11px] text-slate-400">
            ระบบจัดการฟาร์มกุ้ง ปู และสัตว์น้ำครอบครัว เชื่อมต่อฐานข้อมูลคลาวด์ปลอดภัย
          </p>
        </div>
      </footer>

      {/* Mobile Glass Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'PONDS') setSelectedPondDetailId(null);
        }}
        pondCount={ponds.length}
        unreadAlertsCount={alerts.filter((a) => a.status === 'UNREAD').length}
      />
    </div>
  );
};

export default App;
