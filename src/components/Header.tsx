import React from 'react';
import {
  Waves,
  Calendar,
  LayoutDashboard,
  Fish,
  Wallet,
  LogOut,
  Bell,
  BellRing,
  User as UserIcon,
} from 'lucide-react';
import { formatThaiDate } from '../lib/date';

export type AppTab = 'DASHBOARD' | 'PONDS' | 'FINANCE';

interface HeaderProps {
  farmName: string;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  user?: { name: string; email: string; avatarUrl?: string | null } | null;
  onLogout?: () => void;
  isPushEnabled?: boolean;
  onTogglePush?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  farmName,
  activeTab,
  onTabChange,
  user,
  onLogout,
  isPushEnabled,
  onTogglePush,
}) => {
  const todayStr = formatThaiDate(new Date());

  return (
    <header className="bg-sky-700 text-white shadow-md sticky top-0 z-30 pt-safe">
      <div className="max-w-4xl mx-auto px-4 pt-3 sm:pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 sm:pb-3">
          {/* Brand Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white text-sky-700 flex items-center justify-center shadow-inner flex-shrink-0">
                <Waves className="w-6 h-6 sm:w-7 sm:h-7 text-sky-600 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-white leading-none font-prompt">
                    บ่อดี
                  </h1>
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider bg-sky-800 text-sky-200 px-1.5 py-0.5 rounded border border-sky-600">
                    BODI
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-sky-100 font-light mt-0.5">
                  รู้ทันบ่อ ดูแลง่าย ขายได้ราคา
                </p>
              </div>
            </div>

            {/* Mobile quick icons (Push Notification & Logout) */}
            <div className="flex items-center gap-1.5 sm:hidden">
              {onTogglePush && (
                <button
                  type="button"
                  onClick={onTogglePush}
                  title={isPushEnabled ? 'เปิดแจ้งเตือนแล้ว' : 'เปิดการแจ้งเตือน'}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    isPushEnabled
                      ? 'bg-sky-600/80 text-amber-300'
                      : 'bg-sky-800/80 text-sky-200 hover:text-white'
                  }`}
                >
                  {isPushEnabled ? (
                    <BellRing className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </button>
              )}
              {user && onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="ออกจากระบบ"
                  className="p-2 rounded-xl bg-sky-800/80 text-sky-200 hover:text-white transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Farm & User Context (Desktop) */}
          <div className="hidden sm:flex items-center justify-end gap-3 text-xs sm:text-sm">
            <div className="text-right">
              <span className="block font-semibold text-white truncate max-w-xs">
                {farmName}
              </span>
              <div className="flex items-center justify-end gap-1.5 text-sky-200 text-xs">
                <Calendar className="w-3.5 h-3.5" />
                <span>{todayStr}</span>
              </div>
            </div>

            {onTogglePush && (
              <button
                type="button"
                onClick={onTogglePush}
                title={isPushEnabled ? 'เปิดแจ้งเตือนแล้ว' : 'คลิกเพื่อเปิด Web Push'}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isPushEnabled
                    ? 'bg-sky-600 text-amber-300 ring-1 ring-amber-400/40'
                    : 'bg-sky-800/80 text-sky-200 hover:text-white hover:bg-sky-600'
                }`}
              >
                {isPushEnabled ? (
                  <BellRing className="w-4 h-4" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
              </button>
            )}

            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-sky-600/40">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-white/40 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center border border-white/40">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                )}
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    title="ออกจากระบบ"
                    className="p-1.5 rounded-lg text-sky-200 hover:text-white hover:bg-sky-600/60 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop/Tablet Navigation Tabs (Hidden on mobile, handled by BottomNav) */}
        <nav className="hidden sm:flex items-center gap-2 border-t border-sky-600/70 pt-2 pb-2.5">
          <button
            type="button"
            onClick={() => onTabChange('DASHBOARD')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'DASHBOARD'
                ? 'bg-white text-sky-800 shadow-xs'
                : 'text-sky-100 hover:text-white hover:bg-sky-600/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>หน้าหลัก</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('PONDS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'PONDS'
                ? 'bg-white text-sky-800 shadow-xs'
                : 'text-sky-100 hover:text-white hover:bg-sky-600/50'
            }`}
          >
            <Fish className="w-4 h-4" />
            <span>บ่อเลี้ยง</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('FINANCE')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'FINANCE'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-sky-100 hover:text-white hover:bg-sky-600/50'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>บัญชีฟาร์ม</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
