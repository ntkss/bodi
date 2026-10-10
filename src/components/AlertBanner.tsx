import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Info,
  BookOpen,
  X,
  History,
} from 'lucide-react';
import { Alert } from '../types';
import { formatRelativeTime, formatThaiDateTime } from '../lib/date';
import { DOCUMENTED_ALERT_RULES } from '../lib/alerts';

interface AlertBannerProps {
  alerts: Alert[];
  onReview: (id: string) => void;
  onResolve: (id: string) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  alerts,
  onReview,
  onResolve,
}) => {
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const activeAlerts = alerts.filter(
    (a) => a.status === 'UNREAD' || a.status === 'REVIEWED'
  );
  const unreadAlerts = alerts.filter((a) => a.status === 'UNREAD');
  const resolvedAlerts = alerts.filter((a) => a.status === 'RESOLVED');

  return (
    <div className="mb-6 space-y-3">
      {/* Top Banner Control: Rules Info & History toggle */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div className="flex items-center gap-1.5 font-medium">
          {unreadAlerts.length > 0 ? (
            <span className="flex items-center gap-1.5 text-amber-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              มีการแจ้งเตือน {unreadAlerts.length} รายการที่ต้องใส่ใจ
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ไม่มีการแจ้งเตือนวิกฤตขณะนี้
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {resolvedAlerts.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {showHistory
                  ? 'ซ่อนประวัติ'
                  : `ประวัติที่แก้ไขแล้ว (${resolvedAlerts.length})`}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ดูกฎการเตือน 4 ข้อ</span>
          </button>
        </div>
      </div>

      {/* Active Alerts List */}
      {activeAlerts.map((alert) => {
        const isCritical = alert.severity === 'CRITICAL';
        const isWarning = alert.severity === 'WARNING';
        const isReviewed = alert.status === 'REVIEWED';

        return (
          <div
            key={alert.id}
            className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition-all ${
              isReviewed
                ? 'bg-slate-50/90 border-slate-300 text-slate-800 opacity-90'
                : isCritical
                  ? 'bg-rose-50 border-rose-400 text-rose-950'
                  : isWarning
                    ? 'bg-amber-50 border-amber-400 text-amber-950'
                    : 'bg-blue-50 border-blue-400 text-blue-950'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                {isCritical ? (
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                ) : isWarning ? (
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                ) : (
                  <Info className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">{alert.title}</h3>
                  {alert.pondName && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-300">
                      {alert.pondName}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    {formatRelativeTime(alert.createdAt)}
                  </span>
                  {isReviewed && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200">
                      รับทราบแล้ว
                    </span>
                  )}
                </div>
                <p className="text-sm mt-1 text-slate-800 leading-relaxed">
                  {alert.message}
                </p>
              </div>
            </div>

            {/* Actions: Review / Resolve */}
            <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
              {!isReviewed && (
                <button
                  onClick={() => onReview(alert.id)}
                  type="button"
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4 text-slate-500" />
                  <span>รับทราบ</span>
                </button>
              )}
              <button
                onClick={() => onResolve(alert.id)}
                type="button"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>แก้ไขแล้ว</span>
              </button>
            </div>
          </div>
        );
      })}

      {/* Resolved History Drawer (When toggled) */}
      {showHistory && resolvedAlerts.length > 0 && (
        <div className="bg-slate-100/90 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
          <h4 className="font-bold text-slate-700 mb-1">
            ประวัติการแจ้งเตือนที่แก้ไขแล้ว ({resolvedAlerts.length} รายการ)
          </h4>
          {resolvedAlerts.map((a) => (
            <div
              key={a.id}
              className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-slate-600"
            >
              <div>
                <span className="font-semibold text-slate-800">{a.title}</span>
                <span className="ml-2 text-slate-400">
                  {formatThaiDateTime(a.createdAt)}
                </span>
              </div>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                แก้ไขแล้ว
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Documented Rules Info Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-700" />
                <h3 className="text-lg font-bold text-slate-900">
                  เกณฑ์และกฎการแจ้งเตือนในระบบ บ่อดี (BODI)
                </h3>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
              ระบบใช้กฎเกณฑ์ตรงไปตรงมา 4 ข้อในการเฝ้าระวังสภาพบ่อ
              เพื่อแจ้งเตือนในแอปทันทีเมื่อพบความเสี่ยง
              โดยมีระบบป้องกันการแจ้งเตือนซ้ำซ้อนในวันเดียวกัน:
            </p>

            <div className="space-y-3">
              {DOCUMENTED_ALERT_RULES.map((rule, idx) => (
                <div
                  key={rule.code}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">
                      กฎที่ {idx + 1}: {rule.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        rule.defaultSeverity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : rule.defaultSeverity === 'WARNING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {rule.defaultSeverity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {rule.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-900 cursor-pointer"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
