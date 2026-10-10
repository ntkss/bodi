import React, { useState } from 'react';
import {
  CloudRain,
  Waves,
  MapPin,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Clock,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ReferenceStation, VerificationStatus, FreshnessStatus } from '../types';
import { FarmProfile } from '../context/AuthContext';
import { formatThaiDateTime } from '../lib/date';

interface EnvironmentalCardProps {
  stations: ReferenceStation[];
  farm: FarmProfile | null;
  onOpenLocationModal: () => void;
  onSyncVerifiedSource: () => Promise<void>;
  isSyncing?: boolean;
}

export const EnvironmentalCard: React.FC<EnvironmentalCardProps> = ({
  stations,
  farm,
  onOpenLocationModal,
  onSyncVerifiedSource,
  isSyncing = false,
}) => {
  const [showExplanation, setShowExplanation] = useState(false);

  // Status Badge Helper
  const renderVerificationBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3" />
            <span>ยืนยันแล้ว (VERIFIED)</span>
          </span>
        );
      case 'CANDIDATE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            <span>นำเข้าตาราง (CANDIDATE)</span>
          </span>
        );
      case 'BLOCKED':
      case 'UNAVAILABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3 text-slate-400" />
            <span>ไม่มี API สาธารณะ (BLOCKED)</span>
          </span>
        );
    }
  };

  const renderFreshnessBadge = (freshness?: FreshnessStatus) => {
    switch (freshness) {
      case 'FRESH':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>ข้อมูลสดใหม่</span>
          </span>
        );
      case 'STALE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
            <AlertCircle className="w-3 h-3" />
            <span>ข้อมูลเก่าเกิน 3 ชม. (STALE)</span>
          </span>
        );
      case 'NO_DATA':
      default:
        return (
          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            ยังไม่มีข้อมูล
          </span>
        );
    }
  };

  const farmLocationText = [
    farm?.subdistrict ? `ต.${farm.subdistrict}` : '',
    farm?.district ? `อ.${farm.district}` : '',
    farm?.province || 'จ.สมุทรสงคราม',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <CloudRain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base font-prompt">
                สถานีอ้างอิงสภาพแวดล้อม & ข้อมูลน้ำรอบฟาร์ม
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-sky-600" />
                <span>{farmLocationText}</span>
                {farm?.waterSourceCanal && (
                  <span className="text-slate-400">
                    • คลองส่งน้ำ: {farm.waterSourceCanal}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={onOpenLocationModal}
            className="text-xs font-semibold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            ตั้งค่าพิกัดฟาร์ม
          </button>
          <button
            type="button"
            onClick={onSyncVerifiedSource}
            disabled={isSyncing}
            title="ทดสอบดึงข้อมูลสดจาก Open-Meteo"
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-50 px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>ทดสอบดึงข้อมูลสด</span>
          </button>
        </div>
      </div>

      {/* Critical Scientific Guard Notice */}
      <div className="mt-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600 leading-relaxed">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">
                หลักการเฝ้าระวังความเสี่ยงน้ำธรรมชาติ (Milestone 1 — Data Discovery)
              </p>
              <p className="text-slate-500 mt-0.5">
                ข้อมูลภายนอกใช้สำหรับเฝ้าระวังเพื่อตัดสินใจเดินตรวจคลองและบ่อ
                <strong className="text-slate-700 font-medium">
                  {' '}
                  ไม่สามารถสรุปว่าน้ำในบ่อปลอดภัยหรือเน่าเสีย{' '}
                </strong>
                และระดับน้ำทำนายเป็นค่าทางดาราศาสตร์ ไม่ใช่ระดับน้ำจริงในคลองของฟาร์ม
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-[11px] text-sky-700 hover:underline flex-shrink-0 cursor-pointer"
          >
            {showExplanation ? 'ซ่อนคำอธิบาย' : 'ดูรายละเอียด'}
          </button>
        </div>

        {showExplanation && (
          <div className="mt-3 pt-3 border-t border-slate-200 text-slate-600 space-y-1.5 text-[11px]">
            <p>
              • <strong>ข้อมูลที่สดใหม่ (FRESH):</strong> ตรวจวัดภายใน 3 ชั่วโมงที่ผ่านมา
            </p>
            <p>
              • <strong>ข้อมูลเก่า (STALE) / ขาดหาย:</strong> มีสถานะคือ{' '}
              <span className="text-amber-800 font-medium">
                &quot;ไม่ทราบสถานะ (UNKNOWN)&quot;
              </span>{' '}
              ระบบจะไม่สรุปว่าปลอดภัยเด็ดขาด
            </p>
            <p>
              • <strong>การเชื่อมต่อภายนอก:</strong> ทำงานผ่านเซิร์ฟเวอร์ (Server-side)
              ทั้งหมด ไม่เปิดเผยข้อมูลลับในเบราว์เซอร์
            </p>
          </div>
        )}
      </div>

      {/* Station Cards Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {stations.map((st) => {
          const isVerified = st.verificationStatus === 'VERIFIED';
          const isCandidate = st.verificationStatus === 'CANDIDATE';
          const latest = st.latestReading;

          return (
            <div
              key={st.id}
              className={`rounded-xl p-3.5 border transition-all ${
                isVerified
                  ? 'bg-sky-50/40 border-sky-200'
                  : isCandidate
                    ? 'bg-amber-50/30 border-amber-200'
                    : 'bg-slate-50 border-slate-200 opacity-80'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {st.provider === 'OPEN_METEO' ? (
                    <CloudRain className="w-4 h-4 text-sky-600" />
                  ) : (
                    <Waves className="w-4 h-4 text-teal-600" />
                  )}
                  <h4 className="font-semibold text-slate-900 text-xs sm:text-sm">
                    {st.name}
                  </h4>
                </div>
                {st.sourceUrl && (
                  <a
                    href={st.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="เปิดหน้าทางการของแหล่งข้อมูล"
                    className="text-slate-400 hover:text-sky-600 p-0.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2 mt-2">
                {renderVerificationBadge(st.verificationStatus)}
                {isVerified && renderFreshnessBadge(st.freshness)}
              </div>

              {/* Relevance & Hydrological Notes */}
              <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                {st.relevanceNotes}
              </p>

              {/* Latest Observations / Import Status */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-xs">
                {latest ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-slate-800 font-medium">
                      <span>ค่าตรวจวัดล่าสุด ({latest.parameter}):</span>
                      <span className="font-mono text-sky-800">
                        {latest.value} {latest.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>เวลาตรวจวัด (observedAt):</span>
                      <span>{formatThaiDateTime(latest.observedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>เวลาที่ระบบดึง (fetchedAt):</span>
                      <span>{formatThaiDateTime(latest.fetchedAt)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 italic">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>
                      {isVerified
                        ? 'ยังไม่มีการดึงข้อมูล กดปุ่ม "ทดสอบดึงข้อมูลสด" ด้านบน'
                        : isCandidate
                          ? 'รอการนำเข้าตารางประจำปี (PDF Fallback)'
                          : 'ไม่มีช่องทางเชื่อมต่อ API สาธารณะ'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
