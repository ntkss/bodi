import React from 'react';
import { LayoutDashboard, Fish, Wallet, ShieldAlert } from 'lucide-react';
import { AppTab } from './Header';

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  pondCount: number;
  unreadAlertsCount?: number;
  hasRiskWarning?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  pondCount,
  unreadAlertsCount = 0,
  hasRiskWarning = false,
}) => {
  return (
    <nav
      aria-label="เมนูหลักด้านล่าง"
      className="fixed bottom-0 left-0 right-0 z-40 sm:hidden pb-safe"
    >
      {/* Frosted Glass / Grass Effect Container */}
      <div className="mx-auto max-w-md px-3 pt-1.5 pb-1">
        <div className="bg-white/85 backdrop-blur-xl border border-white/60 shadow-[0_-4px_24px_rgba(2,132,199,0.12)] rounded-2xl flex items-center justify-around py-1 px-1">
          {/* TAB 1: หน้าหลัก */}
          <button
            type="button"
            onClick={() => onTabChange('DASHBOARD')}
            className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'DASHBOARD'
                ? 'text-sky-700 font-bold bg-sky-50/80 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700 active:scale-95'
            }`}
          >
            <div className="relative">
              <LayoutDashboard
                className={`w-5 h-5 transition-transform ${
                  activeTab === 'DASHBOARD'
                    ? 'scale-110 text-sky-600 stroke-[2.3]'
                    : 'stroke-[1.8]'
                }`}
              />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </div>
            <span className="text-[11px] mt-1 leading-none font-medium">หน้าหลัก</span>
          </button>

          {/* TAB 2: บ่อเลี้ยง */}
          <button
            type="button"
            onClick={() => onTabChange('PONDS')}
            className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'PONDS'
                ? 'text-sky-700 font-bold bg-sky-50/80 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700 active:scale-95'
            }`}
          >
            <div className="relative">
              <Fish
                className={`w-5 h-5 transition-transform ${
                  activeTab === 'PONDS'
                    ? 'scale-110 text-sky-600 stroke-[2.3]'
                    : 'stroke-[1.8]'
                }`}
              />
              {pondCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-sky-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-white">
                  {pondCount}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-1 leading-none font-medium">บ่อเลี้ยง</span>
          </button>

          {/* TAB 3: ความเสี่ยง */}
          <button
            type="button"
            onClick={() => onTabChange('RISK')}
            className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'RISK'
                ? 'text-amber-800 font-bold bg-amber-50/80 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700 active:scale-95'
            }`}
          >
            <div className="relative">
              <ShieldAlert
                className={`w-5 h-5 transition-transform ${
                  activeTab === 'RISK'
                    ? 'scale-110 text-amber-700 stroke-[2.3]'
                    : 'stroke-[1.8]'
                }`}
              />
              {hasRiskWarning && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </div>
            <span className="text-[11px] mt-1 leading-none font-medium">ความเสี่ยง</span>
          </button>

          {/* TAB 4: บัญชีฟาร์ม */}
          <button
            type="button"
            onClick={() => onTabChange('FINANCE')}
            className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'FINANCE'
                ? 'text-emerald-700 font-bold bg-emerald-50/80 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700 active:scale-95'
            }`}
          >
            <div className="relative">
              <Wallet
                className={`w-5 h-5 transition-transform ${
                  activeTab === 'FINANCE'
                    ? 'scale-110 text-emerald-600 stroke-[2.3]'
                    : 'stroke-[1.8]'
                }`}
              />
            </div>
            <span className="text-[11px] mt-1 leading-none font-medium">บัญชีฟาร์ม</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
