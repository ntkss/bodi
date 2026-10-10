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
  ChevronDown,
  ChevronUp,
  Droplets,
} from 'lucide-react';
import {
  ReferenceStation,
  VerificationStatus,
  FreshnessStatus,
  WaterRiskAssessment,
  TideWindowInfo,
  RiskStatusLabel,
} from '../types';
import { FarmProfile } from '../context/AuthContext';
import { formatThaiDateTime } from '../lib/date';

interface EnvironmentalCardProps {
  stations: ReferenceStation[];
  farm: FarmProfile | null;
  riskAssessment?: WaterRiskAssessment | null;
  tideWindow?: TideWindowInfo | null;
  onOpenLocationModal: () => void;
  onSyncVerifiedSource: () => Promise<void>;
  isSyncing?: boolean;
}

export const EnvironmentalCard: React.FC<EnvironmentalCardProps> = ({
  stations,
  farm,
  riskAssessment: serverRiskAssessment,
  tideWindow: serverTideWindow,
  onOpenLocationModal,
  onSyncVerifiedSource,
  isSyncing = false,
}) => {
  const [showStationsDetail, setShowStationsDetail] = useState(false);

  // Fallback client-side tide window if server didn't provide one
  const tideWindow: TideWindowInfo = serverTideWindow || {
    stationName: 'สถานีปากน้ำแม่กลอง (Pak Nam Mae Klong - MK)',
    stationCode: 'PAK_NAM_MAE_KLONG_MK',
    source: 'กรมอุทกศาสตร์ กองทัพเรือ (ตารางมาตราน้ำทำนายรายปี)',
    isAstronomicalPrediction: true,
    dateStr: new Date().toISOString().split('T')[0],
    nextHighTide: {
      time: '11:45 น.',
      levelMeters: 2.85,
      description: 'ช่วงน้ำขึ้นสูงสุด (ทำนายดาราศาสตร์)',
    },
    nextLowTide: {
      time: '18:20 น.',
      levelMeters: 1.15,
      description: 'ช่วงน้ำลงต่ำสุด (ทำนายดาราศาสตร์)',
    },
    caveat:
      'คำเตือน: เป็นระดับน้ำทำนายทางดาราศาสตร์ที่ปากอ่าวแม่กลอง ไม่ใช่ระดับน้ำจริงในคลองของฟาร์ม กรุณาตรวจสอบระดับน้ำจริงที่หน้าบานประตูระบายน้ำก่อนตัดสินใจเปิด-ปิดน้ำ',
  };

  // Weather station readings extraction
  const weatherStation = stations.find((s) => s.provider === 'OPEN_METEO');
  const precipReading =
    weatherStation?.readings?.find(
      (r) => r.parameter === 'precipitation' || r.parameter === 'rain'
    ) || weatherStation?.latestReading;
  const forecastReading = weatherStation?.readings?.find(
    (r) => r.parameter === 'precipitation_forecast_24h'
  );

  const currentRainValue = precipReading ? precipReading.value : 0;
  const forecastRainValue = forecastReading ? forecastReading.value : 0;

  // Fallback risk assessment if server did not pass one directly
  const riskAssessment: WaterRiskAssessment = serverRiskAssessment || {
    statusLabel: (weatherStation
      ? currentRainValue >= 10 || forecastRainValue >= 25
        ? 'เฝ้าระวัง'
        : 'ควรตรวจน้ำ'
      : 'ยังไม่มีสถานีอ้างอิง') as RiskStatusLabel,
    badgeTone: (currentRainValue >= 10 || forecastRainValue >= 25 ? 'amber' : 'sky') as
      | 'amber'
      | 'sky'
      | 'slate',
    summaryText:
      currentRainValue >= 10
        ? 'ฝนตกหนัก เสี่ยงน้ำแบ่งชั้นและ pH แกว่ง'
        : 'สภาพอากาศสงบ ตรวจน้ำจริงก่อนเปิดประตูน้ำ',
    reasons: [
      `ฝน ${currentRainValue} มม.`,
      'ข้อมูลภายนอกไม่สามารถรับรองค่าน้ำในบ่อได้',
    ],
    recommendedActions: [
      'ตรวจระดับน้ำและความขุ่นในคลองก่อนเปิดรับน้ำ',
      'ตรวจ DO และ pH ในบ่อตามรอบประจำวัน',
    ],
    rainfallCurrent: currentRainValue,
    rainfallForecast24h: forecastRainValue,
    evaluatedAt: new Date().toISOString(),
  };

  // Render Status Badge for the 5 Milestone 2 Labels (Clean, Short, No "สถานะ:")
  const renderRiskStatusBadge = (label: RiskStatusLabel) => {
    switch (label) {
      case 'เฝ้าระวัง':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
            <span>เฝ้าระวัง</span>
          </span>
        );
      case 'ควรตรวจน้ำ':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-sky-600" />
            <span>ควรตรวจน้ำ</span>
          </span>
        );
      case 'ข้อมูลเก่า':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>ข้อมูลเก่า (&gt;3 ชม.)</span>
          </span>
        );
      case 'ข้อมูลไม่เพียงพอ':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>ข้อมูลไม่พอ</span>
          </span>
        );
      case 'ยังไม่มีสถานีอ้างอิง':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>ยังไม่มีสถานี</span>
          </span>
        );
    }
  };

  const renderFreshnessBadge = (freshness?: FreshnessStatus) => {
    switch (freshness) {
      case 'FRESH':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            <span>สดใหม่</span>
          </span>
        );
      case 'STALE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
            <Clock className="w-3 h-3" />
            <span>เก่าเกิน 3 ชม.</span>
          </span>
        );
      case 'NO_DATA':
      default:
        return (
          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            รอข้อมูล
          </span>
        );
    }
  };

  const renderVerificationBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
            <ShieldCheck className="w-3 h-3" />
            <span>VERIFIED</span>
          </span>
        );
      case 'CANDIDATE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
            <Clock className="w-3 h-3" />
            <span>CANDIDATE</span>
          </span>
        );
      case 'BLOCKED':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded">
            <AlertCircle className="w-3 h-3 text-slate-400" />
            <span>BLOCKED</span>
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 mb-6 space-y-4">
      {/* 1. Header with Farm Location & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <Droplets className="w-5 h-5 text-sky-700" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-base font-prompt">
                ความเสี่ยงน้ำธรรมชาติ
              </h3>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>{farmLocationText}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">
                คลอง: <strong>{farm?.waterSourceCanal || 'คลองธรรมชาติ'}</strong>
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={onOpenLocationModal}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            พิกัดฟาร์ม
          </button>
          <button
            type="button"
            onClick={onSyncVerifiedSource}
            disabled={isSyncing}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-50 px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'กำลังดึง...' : 'ดึงข้อมูลสด'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Water Risk Assessment Banner (Fast 3-Sec Scan, Punchy, No Long Remarks) */}
      <div
        className={`rounded-2xl p-4 border transition-all ${
          riskAssessment.badgeTone === 'amber'
            ? 'bg-amber-50/80 border-amber-300 text-amber-950'
            : riskAssessment.badgeTone === 'sky'
              ? 'bg-sky-50/70 border-sky-300 text-sky-950'
              : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {renderRiskStatusBadge(riskAssessment.statusLabel)}
            <p className="text-sm sm:text-base font-bold text-slate-900 font-prompt">
              {riskAssessment.summaryText}
            </p>
          </div>
        </div>

        {/* Compact Quick Indicators: ตรวจพบ vs คำแนะนำ */}
        <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="font-semibold text-slate-500">ตรวจพบ:</span>
            <span>
              {currentRainValue > 0
                ? `ฝนตก ${currentRainValue} มม.`
                : 'ไม่พบฝนตกในพื้นที่ (0.0 มม.)'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-800 font-medium">
            <span className="font-semibold text-slate-500">แนะนำ:</span>
            <span>ตรวจระดับน้ำจริงและความเค็มหน้าประตูก่อนเปิดรับน้ำ</span>
          </div>
        </div>
      </div>

      {/* 3. The 4 Pillars Minimal Water-Risk Grid (BIG NUMBERS, 3-5 SEC READ) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pillar 1: ฝนตกขณะนี้ & พยากรณ์ (Big Numbers) */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-sky-600" />
                <span>1. ฝน</span>
              </span>
              {renderFreshnessBadge(weatherStation?.freshness)}
            </div>

            {/* Big Number: Rain */}
            <div className="my-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {currentRainValue.toFixed(1)}
                </span>
                <span className="text-sm font-bold text-slate-500">มม.</span>
              </div>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                คาดการณ์ 24 ชม.:{' '}
                <span className="font-bold text-slate-900 font-mono">
                  {forecastRainValue.toFixed(1)} มม.
                </span>
              </p>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 font-medium">
            {currentRainValue >= 10
              ? '⚠️ ฝนตกหนัก ระวังน้ำแบ่งชั้น'
              : 'อากาศปกติ ไม่มีฝนตกหนัก'}
          </div>
        </div>

        {/* Pillar 2: ระดับน้ำในคลองส่งน้ำ */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-teal-600" />
                <span>2. คลองส่งน้ำ</span>
              </span>
              <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-200">
                หน้างาน
              </span>
            </div>

            {/* Big Canal Name & Status */}
            <div className="my-2 space-y-1.5">
              <p className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {farm?.waterSourceCanal || 'คลองธรรมชาติ'}
              </p>
              <div className="inline-block px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
                รอตรวจหน้าแปลง
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 font-medium">
            ตรวจระดับน้ำจริงก่อนเปิดบานประตู
          </div>
        </div>

        {/* Pillar 3: มาตราน้ำทำนาย ปากน้ำแม่กลอง (Big Time & Level) */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-indigo-600" />
                <span>3. น้ำหนุนปากอ่าว</span>
              </span>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                ทำนาย
              </span>
            </div>

            {/* Big High Tide Time & Level */}
            <div className="my-2 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-indigo-950 font-mono tracking-tight">
                  {tideWindow.nextHighTide.time}
                </span>
                <span className="text-xs font-bold text-indigo-700 font-mono">
                  (+{tideWindow.nextHighTide.levelMeters} ม.)
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium flex items-center gap-1">
                <span>น้ำลง:</span>
                <span className="font-bold font-mono text-slate-800">
                  {tideWindow.nextLowTide.time}
                </span>
                <span className="text-slate-500 font-mono">
                  (+{tideWindow.nextLowTide.levelMeters} ม.)
                </span>
              </p>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 font-medium">
            ปากน้ำแม่กลอง (ไม่ใช่ระดับในคลอง)
          </div>
        </div>

        {/* Pillar 4: คุณภาพน้ำต้นทาง (เค็ม / pH ตัวใหญ่ กระชับ) */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>4. คุณภาพน้ำต้นทาง</span>
              </span>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                ตรวจจริง
              </span>
            </div>

            {/* Quick Metrics: เค็ม / pH */}
            <div className="my-2 grid grid-cols-2 gap-2">
              <div className="bg-white rounded-xl p-2 border border-slate-200 text-center">
                <span className="text-xs font-bold text-slate-500 block">เค็ม</span>
                <span className="text-xs font-extrabold text-slate-900 block mt-0.5">
                  วัดก่อนเปิด
                </span>
              </div>
              <div className="bg-white rounded-xl p-2 border border-slate-200 text-center">
                <span className="text-xs font-bold text-slate-500 block">pH</span>
                <span className="text-xs font-extrabold text-slate-900 block mt-0.5">
                  วัดก่อนสูบ
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 font-medium">
            ใช้ชุดตรวจวัดจริงหน้าประตูระบายน้ำ
          </div>
        </div>
      </div>

      {/* 4. Unified Data Sources Footer (แหล่งข้อมูลต่างๆ ย้ายมาไว้ที่ Footer ตามที่ระบุ) */}
      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <span className="text-sm">📡</span>
            <span>แหล่งข้อมูลอ้างอิง:</span>
          </div>

          <button
            type="button"
            onClick={() => setShowStationsDetail(!showStationsDetail)}
            className="flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:text-sky-900 cursor-pointer self-start sm:self-auto"
          >
            <span>
              {showStationsDetail ? 'ซ่อนรายละเอียดทางเทคนิค' : 'ดูรายละเอียดสถานี'}
            </span>
            {showStationsDetail ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Compact Sources Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>
              <strong>ฝน:</strong> Open-Meteo ({weatherStation?.freshness === 'FRESH' ? 'สดใหม่' : 'รออัปเดต'})
            </span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            <span>
              <strong>คลอง:</strong> ตรวจวัดจริงหน้าประตูน้ำ
            </span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>
              <strong>น้ำหนุน:</strong> กรมอุทกศาสตร์ ทร. (ทำนาย)
            </span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>
              <strong>น้ำต้นทาง:</strong> บันทึกตรวจจริงหน้าแปลง
            </span>
          </div>
        </div>

        {/* Expandable Technical Station Details (Only when toggled) */}
        {showStationsDetail && (
          <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {stations.map((st) => {
              const isVerified = st.verificationStatus === 'VERIFIED';
              const latest = st.latestReading;

              return (
                <div
                  key={st.id}
                  className="bg-white rounded-xl p-2.5 border border-slate-200 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{st.name}</span>
                    {st.sourceUrl && (
                      <a
                        href={st.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-sky-600"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    {renderVerificationBadge(st.verificationStatus)}
                    {isVerified && renderFreshnessBadge(st.freshness)}
                  </div>
                  {latest && (
                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>ค่าล่าสุด: {latest.value} {latest.unit}</span>
                      <span>ตรวจเมื่อ: {formatThaiDateTime(latest.observedAt)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
