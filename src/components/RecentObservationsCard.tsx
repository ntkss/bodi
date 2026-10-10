import React from 'react';
import { Eye, AlertCircle, Clock } from 'lucide-react';
import { PondLog, Pond } from '../types';
import { formatRelativeTime } from '../lib/date';

interface RecentObservationsCardProps {
  logs: PondLog[];
  ponds: Pond[];
  onAddObservation: () => void;
}

export const RecentObservationsCard: React.FC<RecentObservationsCardProps> = ({
  logs,
  ponds,
  onAddObservation,
}) => {
  const observationLogs = logs.filter((l) => l.type === 'ANIMAL_OBSERVATION').slice(0, 3); // Top 3 most recent

  const getPondName = (pondId: string) => {
    const pond = ponds.find((p) => p.id === pondId);
    return pond ? pond.name.split(' ')[0] : 'บ่อเลี้ยง';
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-2xs p-4 sm:p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-slate-800">
            การสังเกตสัตว์น้ำและการตายล่าสุด
          </h2>
        </div>
        <button
          onClick={onAddObservation}
          type="button"
          className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:bg-amber-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
        >
          + บันทึกเพิ่ม
        </button>
      </div>

      {observationLogs.length === 0 ? (
        <p className="text-xs sm:text-sm text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
          ยังไม่มีการบันทึกการสังเกตอาการหรือสัตว์น้ำตายในช่วงนี้
        </p>
      ) : (
        <div className="space-y-2">
          {observationLogs.map((log) => {
            const hasMortality = log.mortalityCount != null && log.mortalityCount > 0;

            return (
              <div
                key={log.id}
                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  hasMortality
                    ? 'bg-rose-50/70 border-rose-200'
                    : 'bg-amber-50/40 border-amber-200/60'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800">
                      {getPondName(log.pondId)}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatRelativeTime(log.recordedAt)}</span>
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 mt-1">
                    {log.observation || 'สังเกตการณ์ทั่วไป'}
                  </p>
                </div>

                {hasMortality ? (
                  <span className="self-start sm:self-center inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-300">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>พบตาย {log.mortalityCount} ตัว</span>
                  </span>
                ) : (
                  <span className="self-start sm:self-center text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ไม่พบตัวตาย
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
