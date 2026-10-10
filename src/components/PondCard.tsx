import React from 'react';
import { Pond } from '../types';
import { formatRelativeTime } from '../lib/date';
import { HelpCircle, Clock, Edit2 } from 'lucide-react';

interface PondCardProps {
  pond: Pond;
  onRecordClick: (pondId: string) => void;
  onViewDetail?: (pondId: string) => void;
  onEditPond?: (pond: Pond) => void;
}

export const PondCard: React.FC<PondCardProps> = ({
  pond,
  onRecordClick,
  onViewDetail,
  onEditPond,
}) => {
  const isResting = pond.status === 'RESTING';
  const latestLog = pond.latestLog;
  const hasWaterQuality =
    latestLog &&
    (latestLog.dissolvedOxygen != null ||
      latestLog.ph != null ||
      latestLog.salinity != null ||
      latestLog.temperature != null);

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-4 sm:p-5 hover:border-sky-300 transition-colors">
      {/* Pond Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
        <div
          className={onViewDetail ? 'cursor-pointer group' : ''}
          onClick={() => onViewDetail && onViewDetail(pond.id)}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
              {pond.name}
            </h3>
            {isResting ? (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                พักบ่อ / ตากบ่อ
              </span>
            ) : (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                กำลังเลี้ยง
              </span>
            )}
          </div>
          <div className="text-xs sm:text-sm text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {pond.area && <span>ขนาด {pond.area} ไร่</span>}
            {pond.species && <span>พันธุ์: {pond.species}</span>}
            {pond.farmingMethod && <span>วิธี: {pond.farmingMethod}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-center">
          {onEditPond && (
            <button
              onClick={() => onEditPond(pond)}
              type="button"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="แก้ไขข้อมูลบ่อ"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onViewDetail && (
            <button
              onClick={() => onViewDetail(pond.id)}
              type="button"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
            >
              ประวัติบ่อ
            </button>
          )}
          <button
            onClick={() => onRecordClick(pond.id)}
            type="button"
            className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 active:bg-sky-200 text-sky-800 font-medium text-xs sm:text-sm rounded-xl border border-sky-300 transition-colors cursor-pointer"
          >
            + บันทึก
          </button>
        </div>
      </div>

      {/* Latest Status / Water Quality */}
      {isResting ? (
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
          <p className="text-sm text-slate-600">
            {latestLog?.notes || 'บ่ออยู่ในช่วงพักตากเลนและปรับปรุงสภาพดิน'}
          </p>
          {latestLog?.recordedAt && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>บันทึกล่าสุด: {formatRelativeTime(latestLog.recordedAt)}</span>
            </p>
          )}
        </div>
      ) : hasWaterQuality && latestLog ? (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium text-slate-700">ค่าน้ำล่าสุด</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatRelativeTime(latestLog.recordedAt)}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {/* DO */}
            <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100">
              <span className="text-xs text-slate-500 block">DO (ออกซิเจน)</span>
              <span className="text-lg font-bold text-sky-900 block mt-0.5">
                {latestLog.dissolvedOxygen != null ? `${latestLog.dissolvedOxygen}` : '-'}
              </span>
              <span className="text-[10px] text-slate-500">mg/L</span>
            </div>

            {/* pH */}
            <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-100">
              <span className="text-xs text-slate-500 block">pH (กรด-ด่าง)</span>
              <span className="text-lg font-bold text-teal-900 block mt-0.5">
                {latestLog.ph != null ? `${latestLog.ph}` : '-'}
              </span>
              <span className="text-[10px] text-slate-500">ระดับ pH</span>
            </div>

            {/* Salinity */}
            <div className="p-2.5 rounded-xl bg-cyan-50/70 border border-cyan-100">
              <span className="text-xs text-slate-500 block">ความเค็ม</span>
              <span className="text-lg font-bold text-cyan-900 block mt-0.5">
                {latestLog.salinity != null ? `${latestLog.salinity}` : '-'}
              </span>
              <span className="text-[10px] text-slate-500">ppt (ส่วนในพัน)</span>
            </div>

            {/* Temperature */}
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
              <span className="text-xs text-slate-500 block">อุณหภูมิ</span>
              <span className="text-lg font-bold text-amber-900 block mt-0.5">
                {latestLog.temperature != null ? `${latestLog.temperature}°` : '-'}
              </span>
              <span className="text-[10px] text-slate-500">°C เซลเซียส</span>
            </div>
          </div>

          {latestLog.notes && (
            <p className="text-xs sm:text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
              บันทึก: {latestLog.notes}
            </p>
          )}
        </div>
      ) : (
        /* CRITICAL UX RULE: Missing or stale readings must show "ไม่มีข้อมูลล่าสุด", never infer "ปกติ" */
        <div className="bg-amber-50/60 rounded-xl p-3.5 border border-amber-200 flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-amber-950">ไม่มีข้อมูลล่าสุด</h4>
            <p className="text-xs sm:text-sm text-amber-800 mt-0.5 leading-relaxed">
              ยังไม่มีการบันทึกค่าน้ำสำหรับบ่อนี้ หรือข้อมูลเก่าเกินกำหนด
              (ระบบจะไม่คาดเดาว่าปลอดภัยเมื่อไม่มีการวัด)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
