import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Alert } from '../types';
import { formatRelativeTime } from '../lib/date';

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onDismiss }) => {
  const activeAlerts = alerts.filter((a) => a.status === 'UNREAD');

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      {activeAlerts.map((alert) => {
        const isCritical = alert.severity === 'CRITICAL';
        const isWarning = alert.severity === 'WARNING';

        return (
          <div
            key={alert.id}
            className={`p-4 rounded-xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
              isCritical
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
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/80 border border-slate-300">
                      {alert.pondName}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    {formatRelativeTime(alert.createdAt)}
                  </span>
                </div>
                <p className="text-sm mt-1 text-slate-800 leading-relaxed">
                  {alert.message}
                </p>
              </div>
            </div>

            <button
              onClick={() => onDismiss(alert.id)}
              type="button"
              className="self-end sm:self-center px-4 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-medium text-sm rounded-lg border border-slate-300 shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0 min-h-[40px]"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>รับทราบแล้ว</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
