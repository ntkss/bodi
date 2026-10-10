import { Pond, PondLog, Alert, AlertSeverity } from '../types';

export interface AlertRuleInfo {
  code: string;
  category: 'POND' | 'ENVIRONMENTAL';
  name: string;
  description: string;
  defaultSeverity: AlertSeverity;
  thresholdNotes?: string;
}

export const DOCUMENTED_ALERT_RULES: AlertRuleInfo[] = [
  // 1. Pond-level Rules (Pond Evidence)
  {
    code: 'LOW_DO',
    category: 'POND',
    name: 'ออกซิเจนละลายน้ำ (DO) ต่ำกว่าเกณฑ์',
    description:
      'แจ้งเตือนเมื่อวัดค่า DO ได้ต่ำกว่า 3.5 mg/L (หากต่ำกว่า 2.5 mg/L ยกระดับเป็นวิกฤต) เสี่ยงต่อการลอยหัวและขาดอากาศ',
    defaultSeverity: 'WARNING',
    thresholdNotes: 'เกณฑ์วิชาการ: ต่ำกว่า 3.5 mg/L เริ่มเครียด, ต่ำกว่า 2.5 mg/L วิกฤตเสี่ยงตาย',
  },
  {
    code: 'PH_ANOMALY',
    category: 'POND',
    name: 'ความเป็นกรด-ด่าง (pH) ผิดปกติ',
    description:
      'แจ้งเตือนเมื่อค่า pH ต่ำกว่า 7.0 (น้ำเป็นกรด) หรือสูงกว่า 9.0 (น้ำเป็นด่างจัด) ซึ่งส่งผลกระทบต่อการลอกคราบและความเครียดของสัตว์น้ำ',
    defaultSeverity: 'WARNING',
    thresholdNotes: 'ช่วงปลอดภัย 7.5 - 8.5 (แกว่งต่อวันไม่ควรเกิน 0.5)',
  },
  {
    code: 'MORTALITY_SYMPTOMS',
    category: 'POND',
    name: 'พบสัตว์น้ำตายหรืออาการผิดปกติ',
    description:
      'แจ้งเตือนเมื่อมีการบันทึกพบสัตว์น้ำตาย (>0 ตัว) หรือพบอาการผิดปกติ เช่น กุ้งลอยหัวริมขอบบ่อ ตัวแดง เหงือกดำ หรือไม่กินอาหาร',
    defaultSeverity: 'CRITICAL',
    thresholdNotes: 'ตาย >5 ตัว ยกระดับเป็นวิกฤตสูงสุด',
  },
  {
    code: 'STALE_WATER_READING',
    category: 'POND',
    name: 'ค่าน้ำเก่าเกินกำหนดสำหรับบ่อที่กำลังเลี้ยง',
    description:
      'แจ้งเตือนเมื่อบ่อที่กำลังเลี้ยงอยู่ไม่มีการตรวจวัดค่าน้ำเกิน 3 วัน (ระบบไม่สรุปว่าปลอดภัยเมื่อไม่มีการตรวจวัด)',
    defaultSeverity: 'INFO',
    thresholdNotes: 'เกิน 72 ชั่วโมง กระตุ้นให้เดินตรวจวัดค่าน้ำจริงในบ่อ',
  },
  // 2. Environmental Rules (Farm-wide / External Evidence)
  {
    code: 'ENV_HEAVY_RAIN',
    category: 'ENVIRONMENTAL',
    name: 'เฝ้าระวังฝนตกหนัก / ชะล้างหน้าดิน',
    description:
      'แจ้งเตือนเมื่อปริมาณน้ำฝนปัจจุบัน ≥ 10.0 มม./ชม. หรือคาดการณ์ฝน 24 ชม. ข้างหน้า ≥ 25.0 มม. เสี่ยงน้ำแบ่งชั้น (Stratification), ความเค็มฮวบ และกรดชะล้างจากคันบ่อ แนะนำตรวจวัดความเค็ม/pH ก่อนและหลังฝนตก และหลีกเลี่ยงการเปิดประตูน้ำขณะฝนตกหนัก',
    defaultSeverity: 'WARNING',
    thresholdNotes: 'ตรวจวัดสด ≥ 10.0 mm/hr หรือคาดการณ์ 24 ชม. ≥ 25.0 mm จากสถานีที่ผ่านการตรวจสอบ (VERIFIED)',
  },
  {
    code: 'ENV_HIGH_TIDE_WINDOW',
    category: 'ENVIRONMENTAL',
    name: 'หน้าต่างเวลาน้ำหนุนสูงสุด (ทำนายอุทกศาสตร์)',
    description:
      'แจ้งเตือนช่วง ±2 ชั่วโมงของเวลาจุดน้ำหนุนสูงสุดตามตารางทำนายกรมอุทกศาสตร์ ปากน้ำแม่กลอง เพื่อเตือนให้เดินตรวจระดับน้ำจริงและสิ่งปนเปื้อนที่หน้าประตูระบายน้ำคลองส่งน้ำก่อนตัดสินใจเปิดรับน้ำ (ระดับน้ำทำนายดาราศาสตร์ไม่ใช่ระดับน้ำจริงในคลองส่งน้ำ ห้ามตั้งระบบเปิดน้ำอัตโนมัติ)',
    defaultSeverity: 'INFO',
    thresholdNotes: 'คำนวณจากตารางทำนายดาราศาสตร์ปากน้ำแม่กลอง ±2 ชั่วโมงรอบยอดน้ำขึ้นสูงสุด',
  },
  {
    code: 'ENV_SOURCE_WATER_ANOMALY',
    category: 'ENVIRONMENTAL',
    name: 'คุณภาพน้ำต้นทางจากสถานีตรวจวัดภายนอกผิดปกติ',
    description:
      'แจ้งเตือนเมื่อสถานีตรวจวัดคุณภาพน้ำต้นทางที่มีสถานะ VERIFIED มีค่าผิดปกติเกินเกณฑ์มาตรฐานชลประทาน/ประมง (ระบุพารามิเตอร์ ค่าที่วัดได้ หน่วย แหล่งที่มา และเวลาตรวจวัดอย่างโปร่งใส)',
    defaultSeverity: 'WARNING',
    thresholdNotes: 'ทำงานเฉพาะสถานีที่ผ่านการตรวจสอบ (VERIFIED) และข้อมูลสดใหม่ (<3 ชม.) เท่านั้น',
  },
];

/**
 * Generates a date string in YYYY-MM-DD for Asia/Bangkok
 */
export function getBangkokDateKey(dateInput?: string | Date): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }); // en-CA gives YYYY-MM-DD
}

/**
 * Helper to parse time string like "11:45 น." into minutes from midnight (0..1439)
 */
export function parseTimeToMinutes(timeStr: string): number | null {
  const clean = timeStr.replace('น.', '').trim();
  const parts = clean.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) {
      return h * 60 + m;
    }
  }
  return null;
}

/**
 * Pure function to evaluate alert rules for a specific pond.
 * Deduplicates using dedupeKey so alerts are not spammed multiple times on the same date.
 */
export function evaluateAlertsForPond(
  pond: Pond,
  pondLogs: PondLog[],
  existingAlerts: Alert[]
): Alert[] {
  const newAlerts: Alert[] = [];
  const existingKeys = new Set(
    existingAlerts
      .map((a) => (a as Alert & { dedupeKey?: string }).dedupeKey)
      .filter(Boolean)
  );

  const logsForPond = pondLogs
    .filter((l) => l.pondId === pond.id)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

  const latestWaterLog = logsForPond.find((l) => l.type === 'WATER_QUALITY');

  // Rule 1: Low Dissolved Oxygen (DO)
  if (latestWaterLog && latestWaterLog.dissolvedOxygen != null) {
    const doVal = latestWaterLog.dissolvedOxygen;
    const dateKey = getBangkokDateKey(latestWaterLog.recordedAt);
    const dedupeKey = `LOW_DO_${pond.id}_${dateKey}`;

    if (doVal < 3.5 && !existingKeys.has(dedupeKey)) {
      const isCritical = doVal < 2.5;
      newAlerts.push({
        id: `alert-do-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        pondId: pond.id,
        pondName: pond.name.split(' ')[0],
        title: isCritical
          ? `วิกฤต! ออกซิเจนละลายน้ำ (DO) ต่ำมาก (${doVal} mg/L)`
          : `เฝ้าระวังออกซิเจนละลายน้ำ (DO) ต่ำ (${doVal} mg/L)`,
        message: `${pond.name}: วัดค่า DO ได้ ${doVal} mg/L เสี่ยงกุ้ง/ปูลอยหัวและขาดอากาศ แนะนำเปิดเครื่องตีน้ำหรือเตรียมผลัดเปลี่ยนน้ำ`,
        severity: isCritical ? 'CRITICAL' : 'WARNING',
        status: 'UNREAD',
        dedupeKey,
        ruleCode: 'LOW_DO',
        sourceObservationTime: latestWaterLog.recordedAt,
        createdAt: new Date().toISOString(),
      });
      existingKeys.add(dedupeKey);
    }
  }

  // Rule 2: Extreme pH Out of Bounds
  if (latestWaterLog && latestWaterLog.ph != null) {
    const phVal = latestWaterLog.ph;
    const dateKey = getBangkokDateKey(latestWaterLog.recordedAt);
    const dedupeKey = `PH_ANOMALY_${pond.id}_${dateKey}`;

    if ((phVal < 7.0 || phVal > 9.0) && !existingKeys.has(dedupeKey)) {
      const isAcidic = phVal < 7.0;
      newAlerts.push({
        id: `alert-ph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        pondId: pond.id,
        pondName: pond.name.split(' ')[0],
        title: isAcidic
          ? `สภาพน้ำเป็นกรด (pH ${phVal}) ต่ำกว่าเกณฑ์`
          : `สภาพน้ำเป็นด่างสูง (pH ${phVal}) สูงกว่าเกณฑ์`,
        message: `${pond.name}: ค่าความเป็นกรด-ด่าง pH ${phVal} อยู่นอกช่วงที่เหมาะสม (7.5-8.5) ${
          isAcidic ? 'แนะนำเสริมปูนขาวปรับสภาพน้ำ' : 'แนะนำตรวจสอบการเจริญของแพลงก์ตอน'
        }`,
        severity: 'WARNING',
        status: 'UNREAD',
        dedupeKey,
        ruleCode: 'PH_ANOMALY',
        sourceObservationTime: latestWaterLog.recordedAt,
        createdAt: new Date().toISOString(),
      });
      existingKeys.add(dedupeKey);
    }
  }

  // Rule 3: Mortality or Distress Symptoms
  const latestObservation = logsForPond.find((l) => l.type === 'ANIMAL_OBSERVATION');
  if (latestObservation) {
    const mortality = latestObservation.mortalityCount || 0;
    const observationText = latestObservation.observation || '';
    const hasDistressSymptoms =
      observationText.includes('ลอยหัว') ||
      observationText.includes('ตัวแดง') ||
      observationText.includes('เหงือกดำ') ||
      observationText.includes('ตาย');

    if (mortality > 0 || hasDistressSymptoms) {
      const dateKey = getBangkokDateKey(latestObservation.recordedAt);
      const dedupeKey = `MORTALITY_${pond.id}_${dateKey}`;

      if (!existingKeys.has(dedupeKey)) {
        newAlerts.push({
          id: `alert-mortality-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          pondId: pond.id,
          pondName: pond.name.split(' ')[0],
          title:
            mortality > 0
              ? `พบสัตว์น้ำตาย (${mortality} ตัว)`
              : 'พบอาการผิดปกติของสัตว์น้ำ',
          message: `${pond.name}: ${
            mortality > 0 ? `พบตัวตาย ${mortality} ตัว ` : ''
          }${observationText ? `อาการ: ${observationText}` : ''} แนะนำเดินตรวจคันบ่อและเฝ้าระวังอย่างใกล้ชิด`,
          severity: mortality > 5 ? 'CRITICAL' : 'WARNING',
          status: 'UNREAD',
          dedupeKey,
          ruleCode: 'MORTALITY_SYMPTOMS',
          sourceObservationTime: latestObservation.recordedAt,
          createdAt: new Date().toISOString(),
        });
        existingKeys.add(dedupeKey);
      }
    }
  }

  // Rule 4: Stale Water Reading (> 72 hours for active ponds)
  if (pond.status === 'ACTIVE') {
    const now = new Date().getTime();
    let isStale = false;

    if (latestWaterLog) {
      const hoursSinceReading =
        (now - new Date(latestWaterLog.recordedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceReading > 72) {
        isStale = true;
      }
    } else if (pond.createdAt) {
      const hoursSinceCreated =
        (now - new Date(pond.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreated > 72) {
        isStale = true;
      }
    }

    if (isStale) {
      const todayKey = getBangkokDateKey();
      const dedupeKey = `STALE_READINGS_${pond.id}_${todayKey}`;

      if (!existingKeys.has(dedupeKey)) {
        newAlerts.push({
          id: `alert-stale-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          pondId: pond.id,
          pondName: pond.name.split(' ')[0],
          title: 'ไม่มีข้อมูลค่าน้ำล่าสุดเกิน 3 วัน',
          message: `${pond.name}: ไม่มีการบันทึกค่าน้ำมานานกว่า 3 วัน (ระบบไม่สรุปว่าปลอดภัยเมื่อไม่มีการตรวจวัด)`,
          severity: 'INFO',
          status: 'UNREAD',
          dedupeKey,
          ruleCode: 'STALE_WATER_READING',
          sourceObservationTime: latestWaterLog?.recordedAt || null,
          createdAt: new Date().toISOString(),
        });
        existingKeys.add(dedupeKey);
      }
    }
  }

  return newAlerts;
}

/**
 * Evaluate alert rules for all ponds across the farm.
 */
export function evaluateFarmAlerts(
  ponds: Pond[],
  logs: PondLog[],
  existingAlerts: Alert[]
): Alert[] {
  const generatedAlerts: Alert[] = [];
  const combinedExisting = [...existingAlerts];

  for (const pond of ponds) {
    const alertsForPond = evaluateAlertsForPond(pond, logs, combinedExisting);
    generatedAlerts.push(...alertsForPond);
    combinedExisting.push(...alertsForPond);
  }

  return generatedAlerts;
}

/**
 * Environmental Alert Evaluation Input Interface
 */
export interface EnvironmentalAlertInput {
  farmId: string;
  referenceTime?: Date | string;
  weatherStation?: {
    verificationStatus: string;
    provider?: string;
    name?: string;
    freshness?: string;
    readings?: {
      parameter: string;
      value: number;
      unit?: string;
      observedAt: Date | string;
      status?: string;
    }[];
    latestReading?: {
      parameter: string;
      value: number;
      unit?: string;
      observedAt: Date | string;
      status?: string;
    } | null;
  } | null;
  tideWindow?: {
    dateStr?: string;
    nextHighTide?: {
      time: string;
      levelMeters: number;
      description?: string;
    };
    nextLowTide?: {
      time: string;
      levelMeters: number;
      description?: string;
    };
    caveat?: string;
  } | null;
  existingAlerts?: Alert[];
  thresholds?: {
    currentRainMm?: number;
    forecastRain24hMm?: number;
    tideWindowMinutes?: number;
  };
}

/**
 * Pure function to evaluate environmental alert rules (Rainfall & Tide Window).
 * Kept strictly distinct from pond-level logs (farm-wide alerts with pondId = null).
 * Ensures no alert is generated from unverified or stale data.
 */
export function evaluateEnvironmentalAlerts(input: EnvironmentalAlertInput): Alert[] {
  const { farmId, weatherStation, tideWindow, existingAlerts = [], thresholds } = input;
  const newAlerts: Alert[] = [];
  const existingKeys = new Set(
    existingAlerts
      .map((a) => (a as Alert & { dedupeKey?: string }).dedupeKey)
      .filter(Boolean)
  );

  const refDate = input.referenceTime ? new Date(input.referenceTime) : new Date();
  const todayKey = getBangkokDateKey(refDate);

  // Configurable thresholds
  const currentRainThreshold = thresholds?.currentRainMm ?? 10.0;
  const forecastRainThreshold = thresholds?.forecastRain24hMm ?? 25.0;
  const tideWindowMinutes = thresholds?.tideWindowMinutes ?? 120; // 2 hours

  // 1. Environmental Rule: HEAVY_RAIN
  // Must only alert when station is VERIFIED and FRESH (< 3 hours)
  if (
    weatherStation &&
    weatherStation.verificationStatus === 'VERIFIED' &&
    weatherStation.freshness !== 'STALE'
  ) {
    const readings =
      weatherStation.readings && weatherStation.readings.length > 0
        ? weatherStation.readings
        : weatherStation.latestReading
          ? [weatherStation.latestReading]
          : [];

    const rainReading = readings.find(
      (r) => r.parameter === 'precipitation' || r.parameter === 'rain'
    );
    const forecastReading = readings.find(
      (r) => r.parameter === 'precipitation_forecast_24h'
    );

    const currentRain = rainReading ? rainReading.value : 0;
    const forecastRain = forecastReading ? forecastReading.value : 0;

    if (currentRain >= currentRainThreshold || forecastRain >= forecastRainThreshold) {
      const dedupeKey = `ENV_RAIN_${farmId}_${todayKey}`;

      if (!existingKeys.has(dedupeKey)) {
        const observationTime = (rainReading || forecastReading)?.observedAt || refDate.toISOString();
        const obsTimeStr = new Date(observationTime).toLocaleTimeString('th-TH', {
          timeZone: 'Asia/Bangkok',
          hour: '2-digit',
          minute: '2-digit',
        });

        const alert: Alert = {
          id: `alert-rain-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          pondId: null, // Farm-wide environmental alert
          title:
            currentRain >= currentRainThreshold
              ? `เฝ้าระวังฝนตกหนัก (${currentRain} มม./ชม.)`
              : `เฝ้าระวังพยากรณ์ฝนสะสมสูง (${forecastRain} มม. ใน 24 ชม.)`,
          message: `ตรวจพบฝน ${currentRain} มม. (คาดการณ์ 24 ชม. ข้างหน้า: ${forecastRain} มม.) ข้อมูลตรวจวัดเวลา ${obsTimeStr} น. เสี่ยงน้ำในบ่อแบ่งชั้น (Stratification), ความเค็มฮวบ และกรดชะล้างจากคันบ่อ แนะนำตรวจวัดความเค็ม/pH ก่อนและหลังฝนตก และหลีกเลี่ยงการเปิดประตูระบายน้ำรับน้ำขณะฝนตกหนัก`,
          severity: 'WARNING',
          status: 'UNREAD',
          dedupeKey,
          ruleCode: 'ENV_HEAVY_RAIN',
          sourceObservationTime: new Date(observationTime).toISOString(),
          createdAt: new Date().toISOString(),
        };

        newAlerts.push(alert);
        existingKeys.add(dedupeKey);
      }
    }
  }

  // 2. Environmental Rule: HIGH_TIDE_WINDOW
  // Reminds farmer to check actual canal water level around peak tide window
  if (tideWindow?.nextHighTide?.time) {
    const peakMinutes = parseTimeToMinutes(tideWindow.nextHighTide.time);

    if (peakMinutes != null) {
      // Calculate current minutes in Asia/Bangkok
      const bkkParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Bangkok',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      }).formatToParts(refDate);

      const hourPart = bkkParts.find((p) => p.type === 'hour');
      const minutePart = bkkParts.find((p) => p.type === 'minute');
      const currentBkkMinutes =
        (hourPart ? parseInt(hourPart.value, 10) : 0) * 60 +
        (minutePart ? parseInt(minutePart.value, 10) : 0);

      const diffMinutes = Math.abs(currentBkkMinutes - peakMinutes);

      if (diffMinutes <= tideWindowMinutes) {
        const dateKey = tideWindow.dateStr || todayKey;
        const dedupeKey = `ENV_TIDE_${farmId}_${dateKey}`;

        if (!existingKeys.has(dedupeKey)) {
          const alert: Alert = {
            id: `alert-tide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            pondId: null, // Farm-wide environmental alert
            title: `ช่วงหน้าต่างน้ำหนุนสูงสุด (ทำนายอุทกศาสตร์: ${tideWindow.nextHighTide.time})`,
            message: `ช่วงเวลานี้อยู่ในหน้าต่างน้ำหนุนสูงสุดตามตารางทำนายดาราศาสตร์ ปากน้ำแม่กลอง (~${tideWindow.nextHighTide.levelMeters} ม.) เตือนเกษตรกรให้ "เดินตรวจระดับน้ำจริงและสิ่งปนเปื้อนที่หน้าบานประตูระบายน้ำคลองส่งน้ำ" ก่อนตัดสินใจเปิดรับน้ำ (ระดับน้ำทำนายดาราศาสตร์ไม่ใช่ระดับน้ำจริงในคลองส่งน้ำ ห้ามตั้งระบบเปิดน้ำอัตโนมัติ)`,
            severity: 'INFO',
            status: 'UNREAD',
            dedupeKey,
            ruleCode: 'ENV_HIGH_TIDE_WINDOW',
            sourceObservationTime: refDate.toISOString(),
            createdAt: new Date().toISOString(),
          };

          newAlerts.push(alert);
          existingKeys.add(dedupeKey);
        }
      }
    }
  }

  return newAlerts;
}

/**
 * Unified Alert Evaluation: Runs both pond-level and environmental rules across the farm
 */
export function evaluateAllAlerts(
  input: {
    farmId: string;
    ponds: Pond[];
    pondLogs: PondLog[];
    weatherStation?: EnvironmentalAlertInput['weatherStation'];
    tideWindow?: EnvironmentalAlertInput['tideWindow'];
    existingAlerts?: Alert[];
    referenceTime?: Date | string;
  }
): Alert[] {
  const existing = input.existingAlerts || [];
  const pondAlerts = evaluateFarmAlerts(input.ponds, input.pondLogs, existing);
  const combined = [...existing, ...pondAlerts];

  const envAlerts = evaluateEnvironmentalAlerts({
    farmId: input.farmId,
    weatherStation: input.weatherStation,
    tideWindow: input.tideWindow,
    existingAlerts: combined,
    referenceTime: input.referenceTime,
  });

  return [...pondAlerts, ...envAlerts];
}
