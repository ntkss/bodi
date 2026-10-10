import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Droplet,
  ArrowLeftRight,
  Eye,
  Fish,
  FileText,
  Clock,
  Settings,
} from 'lucide-react';
import { Pond, PondLog, LogType } from '../types';
import { formatThaiDateTime, formatRelativeTime } from '../lib/date';

interface PondDetailViewProps {
  pond: Pond;
  logs: PondLog[];
  onBack: () => void;
  onEditPond: (pond: Pond) => void;
  onAddLog: (pondId: string, initialType?: LogType) => void;
  onEditLog: (log: PondLog) => void;
  onDeleteLog: (logId: string) => void;
}

export const PondDetailView: React.FC<PondDetailViewProps> = ({
  pond,
  logs,
  onBack,
  onEditPond,
  onAddLog,
  onEditLog,
  onDeleteLog,
}) => {
  const [filterType, setFilterType] = useState<LogType | 'ALL'>('ALL');

  const pondLogs = logs.filter((l) => l.pondId === pond.id);
  const filteredLogs =
    filterType === 'ALL' ? pondLogs : pondLogs.filter((l) => l.type === filterType);

  const getLogTypeBadge = (type: LogType) => {
    switch (type) {
      case 'WATER_QUALITY':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 border border-sky-200">
            <Droplet className="w-3.5 h-3.5 text-sky-600" />
            ค่าน้ำ
          </span>
        );
      case 'WATER_EXCHANGE':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-200">
            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
            ถ่ายน้ำ
          </span>
        );
      case 'ANIMAL_OBSERVATION':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
            <Eye className="w-3.5 h-3.5 text-amber-600" />
            สังเกตกุ้ง/ปู
          </span>
        );
      case 'HARVEST':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Fish className="w-3.5 h-3.5 text-emerald-600" />
            จับผลผลิต
          </span>
        );
      case 'GENERAL_NOTE':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            ทั่วไป
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-sky-700 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้ารวมบ่อ</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditPond(pond)}
            type="button"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>แก้ไขข้อมูลบ่อ</span>
          </button>
          <button
            onClick={() => onAddLog(pond.id)}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white bg-sky-700 hover:bg-sky-800 active:bg-sky-900 px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ บันทึกข้อมูล</span>
          </button>
        </div>
      </div>

      {/* Pond Summary Card */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">{pond.name}</h2>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  pond.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : pond.status === 'RESTING'
                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                {pond.status === 'ACTIVE'
                  ? 'กำลังเลี้ยง'
                  : pond.status === 'RESTING'
                    ? 'พักบ่อ / ตากเลน'
                    : 'จับผลผลิตแล้ว'}
              </span>
            </div>
            <div className="text-sm text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {pond.area && <span>พื้นที่: {pond.area} ไร่</span>}
              {pond.waterSource && <span>แหล่งน้ำ: {pond.waterSource}</span>}
              {pond.species && <span>ชนิดสัตว์น้ำ: {pond.species}</span>}
              {pond.farmingMethod && <span>วิธีเลี้ยง: {pond.farmingMethod}</span>}
            </div>
          </div>
        </div>

        {pond.notes && (
          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="font-semibold text-slate-700">หมายเหตุบ่อ: </span>
            {pond.notes}
          </p>
        )}
      </div>

      {/* Logs History Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">
              ประวัติการบันทึก ({pondLogs.length} รายการ)
            </h3>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-white text-sky-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({pondLogs.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('WATER_QUALITY')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === 'WATER_QUALITY'
                  ? 'bg-white text-sky-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ค่าน้ำ
            </button>
            <button
              type="button"
              onClick={() => setFilterType('WATER_EXCHANGE')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === 'WATER_EXCHANGE'
                  ? 'bg-white text-indigo-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ถ่ายน้ำ
            </button>
            <button
              type="button"
              onClick={() => setFilterType('ANIMAL_OBSERVATION')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === 'ANIMAL_OBSERVATION'
                  ? 'bg-white text-amber-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              สังเกตการณ์
            </button>
            <button
              type="button"
              onClick={() => setFilterType('HARVEST')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === 'HARVEST'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              จับผลผลิต
            </button>
          </div>
        </div>

        {/* Logs Timeline List */}
        {filteredLogs.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700 text-base">
              ยังไม่มีบันทึกข้อมูลในหมวดนี้
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              กดปุ่มด้านล่างเพื่อเริ่มบันทึกค่าน้ำ การถ่ายน้ำ
              หรือการสังเกตสำหรับบ่อนี้ได้ทันที
            </p>
            <button
              type="button"
              onClick={() => onAddLog(pond.id)}
              className="mt-4 px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs sm:text-sm rounded-xl border border-sky-300 transition-colors cursor-pointer"
            >
              + บันทึกรายการแรก
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:border-sky-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
                  <div className="flex items-center gap-2">
                    {getLogTypeBadge(log.type)}
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatThaiDateTime(log.recordedAt)}</span>
                      <span className="text-slate-400">
                        ({formatRelativeTime(log.recordedAt)})
                      </span>
                    </span>
                  </div>

                  {/* Log Action Buttons: Edit to correct mistake, Delete */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => onEditLog(log)}
                      className="px-2.5 py-1 text-xs text-sky-700 hover:text-sky-900 hover:bg-sky-50 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                      title="แก้ไขข้อผิดพลาด"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>แก้ไข</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteLog(log.id)}
                      className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                      title="ลบบันทึกนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบ</span>
                    </button>
                  </div>
                </div>

                {/* Log Details Display */}
                {log.type === 'WATER_QUALITY' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center my-2">
                    <div className="bg-sky-50 p-2 rounded-xl border border-sky-100">
                      <span className="text-[11px] text-slate-500 block">
                        DO (ออกซิเจน)
                      </span>
                      <span className="text-base font-bold text-sky-900 block">
                        {log.dissolvedOxygen != null
                          ? `${log.dissolvedOxygen} mg/L`
                          : 'ไม่ได้วัด'}
                      </span>
                    </div>
                    <div className="bg-teal-50 p-2 rounded-xl border border-teal-100">
                      <span className="text-[11px] text-slate-500 block">
                        pH (กรด-ด่าง)
                      </span>
                      <span className="text-base font-bold text-teal-900 block">
                        {log.ph != null ? log.ph : 'ไม่ได้วัด'}
                      </span>
                    </div>
                    <div className="bg-cyan-50 p-2 rounded-xl border border-cyan-100">
                      <span className="text-[11px] text-slate-500 block">ความเค็ม</span>
                      <span className="text-base font-bold text-cyan-900 block">
                        {log.salinity != null ? `${log.salinity} ppt` : 'ไม่ได้วัด'}
                      </span>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-xl border border-amber-100">
                      <span className="text-[11px] text-slate-500 block">อุณหภูมิ</span>
                      <span className="text-base font-bold text-amber-900 block">
                        {log.temperature != null ? `${log.temperature}°C` : 'ไม่ได้วัด'}
                      </span>
                    </div>
                  </div>
                )}

                {log.type === 'WATER_EXCHANGE' && (
                  <div className="bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100 my-1 text-sm text-indigo-950">
                    <span className="font-semibold">
                      {log.exchangeType === 'IN'
                        ? 'สูบน้ำเข้าบ่อ'
                        : log.exchangeType === 'OUT'
                          ? 'ปล่อยน้ำออกจากบ่อ'
                          : 'หมุนเวียนน้ำ'}
                    </span>
                    {log.exchangeVolume && <span> — ปริมาณ: {log.exchangeVolume}</span>}
                  </div>
                )}

                {log.type === 'ANIMAL_OBSERVATION' && (
                  <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100 my-1 text-sm text-amber-950">
                    {log.observation && <p>สังเกตเห็น: {log.observation}</p>}
                    {log.mortalityCount != null && (
                      <p className="font-semibold text-rose-800 mt-0.5">
                        พบตัวตาย / ผิดปกติ: {log.mortalityCount} ตัว
                      </p>
                    )}
                  </div>
                )}

                {log.type === 'HARVEST' && (
                  <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 my-1 text-sm text-emerald-950">
                    <p className="font-bold">
                      จับได้: {log.harvestQuantity} {log.harvestUnit || 'กก.'}
                    </p>
                    {log.harvestPrice != null && (
                      <p className="text-xs font-semibold text-emerald-800">
                        ราคาขายรวม: {log.harvestPrice.toLocaleString('th-TH')} บาท
                      </p>
                    )}
                  </div>
                )}

                {log.notes && (
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="font-medium text-slate-700">หมายเหตุ: </span>
                    {log.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
