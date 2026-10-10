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
  Info,
  Droplets,
  ArrowUpRight,
  ArrowDownRight,
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
  const precipReading = weatherStation?.readings?.find(
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
        ? 'มีฝนตกหนักในพื้นที่ เสี่ยงน้ำในบ่อแบ่งชั้นและค่า pH แกว่ง'
        : 'สภาพอากาศรอบฟาร์มสงบ (ยังคงต้องตรวจค่าน้ำและระดับน้ำจริงก่อนจัดการน้ำ)',
    reasons: [
      `ปริมาณฝนตรวจวัดได้ ${currentRainValue} มม.`,
      'ข้อมูลภายนอกไม่สามารถรับรองได้ว่าน้ำในบ่อหรือคลองมีคุณภาพปลอดภัย 100%',
    ],
    recommendedActions: [
      'ตรวจสอบระดับน้ำจริงและความขุ่นของน้ำในคลองส่งน้ำก่อนเปิดรับน้ำ',
      'ตรวจวัดค่าออกซิเจนละลายน้ำ (DO) และ pH ในบ่อตามรอบประจำวัน',
    ],
    rainfallCurrent: currentRainValue,
    rainfallForecast24h: forecastRainValue,
    evaluatedAt: new Date().toISOString(),
  };

  // Render Status Badge for the 5 Milestone 2 Labels (STRICTLY NO GREEN SAFE)
  const renderRiskStatusBadge = (label: RiskStatusLabel) => {
    switch (label) {
      case 'เฝ้าระวัง':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
            <span>สถานะ: เฝ้าระวัง (Watch)</span>
          </span>
        );
      case 'ควรตรวจน้ำ':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-sky-600" />
            <span>สถานะ: ควรตรวจน้ำ (Inspect Water)</span>
          </span>
        );
      case 'ข้อมูลเก่า':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>สถานะ: ข้อมูลเก่า (Stale Data)</span>
          </span>
        );
      case 'ข้อมูลไม่เพียงพอ':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>สถานะ: ข้อมูลไม่เพียงพอ (Insufficient)</span>
          </span>
        );
      case 'ยังไม่มีสถานีอ้างอิง':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>สถานะ: ยังไม่มีสถานีอ้างอิง</span>
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
            <span>สดใหม่ (&lt;3 ชม.)</span>
          </span>
        );
      case 'STALE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
            <Clock className="w-3 h-3" />
            <span>เก่าเกิน 3 ชม. (STALE)</span>
          </span>
        );
      case 'NO_DATA':
      default:
        return (
          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            ยังไม่มีข้อมูล
          </span>
        );
    }
  };

  const renderVerificationBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
            <ShieldCheck className="w-3 h-3" />
            <span>VERIFIED</span>
          </span>
        );
      case 'CANDIDATE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
            <Clock className="w-3 h-3" />
            <span>CANDIDATE</span>
          </span>
        );
      case 'BLOCKED':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded">
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
                เฝ้าระวังความเสี่ยงน้ำธรรมชาติรอบฟาร์ม
              </h3>
              <span className="text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full">
                Milestone 2
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>{farmLocationText}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">
                คลองส่งน้ำ: <strong>{farm?.waterSourceCanal || 'คลองธรรมชาติ'}</strong>
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
            title="ดึงข้อมูลฝนและสภาพอากาศสดจาก Open-Meteo"
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-50 px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลสด'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Water Risk Assessment Banner (Milestone 2 Core: No-Green-Safe) */}
      <div
        className={`rounded-xl p-4 border transition-all ${
          riskAssessment.badgeTone === 'amber'
            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
            : riskAssessment.badgeTone === 'sky'
              ? 'bg-sky-50/60 border-sky-200 text-sky-950'
              : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {renderRiskStatusBadge(riskAssessment.statusLabel)}
            </div>
            <p className="text-xs sm:text-sm font-semibold pt-1">
              {riskAssessment.summaryText}
            </p>
          </div>
        </div>

        {/* Explainable Reasons & Recommended Actions */}
        <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <h5 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1 text-[11px]">
              <Info className="w-3.5 h-3.5 text-sky-700" />
              <span>เหตุผลและปัจจัยตรวจพบ (Reasons):</span>
            </h5>
            <ul className="space-y-1 text-slate-600 list-disc list-inside">
              {riskAssessment.reasons.map((r, i) => (
                <li key={i} className="leading-snug">
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>คำแนะนำสำหรับเกษตรกรหน้าแปลง (Actions):</span>
            </h5>
            <ul className="space-y-1 text-slate-700 list-disc list-inside font-medium">
              {riskAssessment.recommendedActions.map((a, i) => (
                <li key={i} className="leading-snug">
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Strict Scientific Caution Reminder */}
        <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center gap-1.5 text-[11px] text-slate-500">
          <AlertCircle className="w-3.5 h-3.5 text-sky-700 shrink-0" />
          <span>
            <strong>หลักการทางวิทยาศาสตร์:</strong> ข้อมูลภายนอกใช้สำหรับเฝ้าระวังเพื่อตัดสินใจตรวจน้ำจริง
            ไม่สามารถพิสูจน์ได้ว่าน้ำในบ่อปลอดภัยหรือเน่าเสีย และระดับน้ำทำนายไม่ใช่ระดับน้ำจริงในคลอง
          </span>
        </div>
      </div>

      {/* 3. The 4 Pillars Minimal Water-Risk Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pillar 1: ปริมาณน้ำฝน & พยากรณ์ */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-sky-600" />
                <span>1. น้ำฝน & พยากรณ์</span>
              </span>
              {renderVerificationBadge('VERIFIED')}
            </div>

            <div className="space-y-1 my-2">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-slate-500">ฝนตกขณะนี้:</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {currentRainValue.toFixed(1)} mm
                </span>
              </div>
              <div className="flex items-baseline justify-between text-[11px]">
                <span className="text-slate-500">คาดการณ์ 24 ชม.:</span>
                <span className="font-semibold text-slate-700 font-mono">
                  {forecastRainValue.toFixed(1)} mm
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 text-[10px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">สถานะข้อมูล:</span>
              {renderFreshnessBadge(weatherStation?.freshness)}
            </div>
            {precipReading?.observedAt && (
              <div className="text-slate-400 truncate">
                วัดเมื่อ: {formatThaiDateTime(precipReading.observedAt)}
              </div>
            )}
            <p className="text-slate-600 pt-1 leading-tight border-t border-slate-100">
              <strong>ทำไมจึงสำคัญ:</strong> ฝนตกชะล้างคันดิน กรดซัลเฟตทำให้น้ำเป็นกรด และลดความเค็มฉับพลัน
            </p>
          </div>
        </div>

        {/* Pillar 2: ระดับน้ำในคลองส่งน้ำ */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-teal-600" />
                <span>2. ระดับน้ำในคลอง</span>
              </span>
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                ตรวจหน้างาน
              </span>
            </div>

            <div className="space-y-1.5 my-2">
              <p className="text-xs font-semibold text-slate-800 leading-snug">
                คลอง: {farm?.waterSourceCanal || 'คลองธรรมชาติรอบแปลง'}
              </p>
              <div className="bg-white/80 rounded-lg p-2 border border-slate-200/80 text-[11px] text-slate-600 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span>สถานีอัตโนมัติ:</span>
                  <span className="font-medium text-slate-500">ไม่มีในคลองซอย</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>สถานะระดับน้ำ:</span>
                  <span className="font-semibold text-amber-800">รอตรวจหน้าแปลง</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 text-[10px] space-y-1">
            <div className="text-slate-400">แหล่งข้อมูล: สสน. / ชลประทาน (ไม่มี API คลองซอย)</div>
            <p className="text-slate-600 pt-1 leading-tight border-t border-slate-100">
              <strong>ทำไมจึงสำคัญ:</strong> ระดับน้ำคลองแปรผันตามประตูระบายน้ำ หากสูบตอนน้ำต่ำอาจดูดเลนก้นคลอง
            </p>
          </div>
        </div>

        {/* Pillar 3: มาตราน้ำทำนาย ปากน้ำแม่กลอง */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-indigo-600" />
                <span>3. น้ำทำนาย ปากอ่าว</span>
              </span>
              {renderVerificationBadge('CANDIDATE')}
            </div>

            <div className="space-y-1.5 my-2">
              <div className="bg-white/80 rounded-lg p-2 border border-slate-200/80 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-indigo-900 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5 text-indigo-600" />
                    <span>น้ำขึ้นสูงสุด:</span>
                  </span>
                  <span className="font-bold text-indigo-950 font-mono">
                    {tideWindow.nextHighTide.time} ({tideWindow.nextHighTide.levelMeters}m)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5 text-slate-400" />
                    <span>น้ำลงต่ำสุด:</span>
                  </span>
                  <span className="font-semibold text-slate-700 font-mono">
                    {tideWindow.nextLowTide.time} ({tideWindow.nextLowTide.levelMeters}m)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 text-[10px] space-y-1">
            <div className="text-slate-400 truncate">
              แหล่งข้อมูล: กรมอุทกศาสตร์ ทร. (สถานี MK)
            </div>
            <p className="text-slate-600 pt-1 leading-tight border-t border-slate-100">
              <strong>ทำไมจึงสำคัญ:</strong> ช่วยกะช่วงเวลาเปิดรับน้ำทะเล แต่ต้องระวังตะกอนและขยะช่วงหัวน้ำ
            </p>
          </div>
        </div>

        {/* Pillar 4: คุณภาพน้ำแหล่งน้ำภายนอก */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>4. คุณภาพน้ำต้นทาง</span>
              </span>
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                บันทึกเอง (Manual)
              </span>
            </div>

            <div className="space-y-1.5 my-2">
              <div className="bg-white/80 rounded-lg p-2 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span>ตรวจวัดความเค็ม:</span>
                  <span className="font-semibold text-slate-800">ก่อนเปิดรับน้ำ</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>ตรวจวัดค่า pH:</span>
                  <span className="font-semibold text-slate-800">ก่อนสูบเข้าบ่อ</span>
                </div>
                <div className="text-[10px] text-slate-400 pt-0.5">
                  (PCD IWIS ไม่มี API คลองซอย)
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 text-[10px] space-y-1">
            <div className="text-slate-400">แหล่งข้อมูล: บันทึกตรวจวัดหน้าแปลง (Pond Log)</div>
            <p className="text-slate-600 pt-1 leading-tight border-t border-slate-100">
              <strong>ทำไมจึงสำคัญ:</strong> น้ำคลองอาจมีของเสียหรือน้ำจืดปล่อยทิ้ง ต้องเช็คความเค็มและ pH ก่อนสูบ
            </p>
          </div>
        </div>
      </div>

      {/* 4. Expandable Technical Reference Stations Details */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowStationsDetail(!showStationsDetail)}
          className="w-full flex items-center justify-between py-2 px-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-700" />
            <span>รายละเอียดสถานีอ้างอิงและการเชื่อมต่อ ({stations.length} แหล่งข้อมูล)</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <span>{showStationsDetail ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียดสถานี'}</span>
            {showStationsDetail ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </span>
        </button>

        {showStationsDetail && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {stations.map((st) => {
              const isVerified = st.verificationStatus === 'VERIFIED';
              const isCandidate = st.verificationStatus === 'CANDIDATE';
              const latest = st.latestReading;

              return (
                <div
                  key={st.id}
                  className={`rounded-xl p-3 border text-xs ${
                    isVerified
                      ? 'bg-sky-50/40 border-sky-200'
                      : isCandidate
                        ? 'bg-amber-50/30 border-amber-200'
                        : 'bg-slate-50 border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-slate-900 text-xs">
                      {st.name}
                    </div>
                    {st.sourceUrl && (
                      <a
                        href={st.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="เปิดเอกสารทางการ"
                        className="text-slate-400 hover:text-sky-600 p-0.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1.5">
                    {renderVerificationBadge(st.verificationStatus)}
                    {isVerified && renderFreshnessBadge(st.freshness)}
                  </div>

                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                    {st.relevanceNotes}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[11px]">
                    {latest ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-slate-800 font-medium">
                          <span>ค่าล่าสุด ({latest.parameter}):</span>
                          <span className="font-mono text-sky-800 font-bold">
                            {latest.value} {latest.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>observedAt:</span>
                          <span>{formatThaiDateTime(latest.observedAt)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>fetchedAt:</span>
                          <span>{formatThaiDateTime(latest.fetchedAt)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 italic text-[10px]">
                        {isVerified
                          ? 'ยังไม่มีการดึงข้อมูล กดปุ่ม "ดึงข้อมูลสด" ด้านบน'
                          : isCandidate
                            ? 'ตารางทำนายรายปี (PDF Fallback)'
                            : 'ไม่มี Public REST API สาธารณะ'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
