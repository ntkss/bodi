import { Pond, PondLog, Alert, AlertSeverity } from '../types';

export interface AlertRuleInfo {
  code: string;
  name: string;
  description: string;
  defaultSeverity: AlertSeverity;
}

export const DOCUMENTED_ALERT_RULES: AlertRuleInfo[] = [
  {
    code: 'LOW_DO',
    name: 'ออกซิเจนละลายน้ำ (DO) ต่ำกว่าเกณฑ์',
    description:
      'แจ้งเตือนเมื่อวัดค่า DO ได้ต่ำกว่า 3.5 mg/L (หากต่ำกว่า 2.5 mg/L จะยกระดับเป็นวิกฤต) เสี่ยงต่อการลอยหัวและขาดอากาศ',
    defaultSeverity: 'WARNING',
  },
  {
    code: 'PH_ANOMALY',
    name: 'ความเป็นกรด-ด่าง (pH) ผิดปกติ',
    description:
      'แจ้งเตือนเมื่อค่า pH ต่ำกว่า 7.0 (น้ำเป็นกรด) หรือสูงกว่า 9.0 (น้ำเป็นด่างจัด) ซึ่งส่งผลกระทบต่อการลอกคราบและความเครียดของสัตว์น้ำ',
    defaultSeverity: 'WARNING',
  },
  {
    code: 'MORTALITY_SYMPTOMS',
    name: 'พบสัตว์น้ำตายหรืออาการผิดปกติ',
    description:
      'แจ้งเตือนเมื่อมีการบันทึกพบสัตว์น้ำตาย (>0 ตัว) หรือพบอาการผิดปกติ เช่น กุ้งลอยหัวริมขอบบ่อ ตัวแดง เหงือกดำ หรือไม่กินอาหาร',
    defaultSeverity: 'CRITICAL',
  },
  {
    code: 'STALE_WATER_READING',
    name: 'ค่าน้ำเก่าเกินกำหนดสำหรับบ่อที่กำลังเลี้ยง',
    description:
      'แจ้งเตือนเมื่อบ่อที่กำลังเลี้ยงอยู่ไม่มีการตรวจวัดค่าน้ำเกิน 3 วัน (ระบบจะไม่สรุปว่าบ่อปลอดภัยเมื่อไม่มีการตรวจวัด)',
    defaultSeverity: 'INFO',
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
        createdAt: new Date().toISOString(),
        ...({ dedupeKey } as object),
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
        createdAt: new Date().toISOString(),
        ...({ dedupeKey } as object),
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
          createdAt: new Date().toISOString(),
          ...({ dedupeKey } as object),
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
          createdAt: new Date().toISOString(),
          ...({ dedupeKey } as object),
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
