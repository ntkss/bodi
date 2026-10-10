import { describe, it, expect } from 'vitest';
import {
  evaluateAlertsForPond,
  evaluateFarmAlerts,
  DOCUMENTED_ALERT_RULES,
} from '../src/lib/alerts';
import { Pond, PondLog } from '../src/types';

describe('Milestone 4: In-App Basic Alerts & Deduplication Engine', () => {
  const dummyPond: Pond = {
    id: 'pond-101',
    farmId: 'farm-1',
    name: 'บ่อ 1 กุ้งธรรมชาติ',
    status: 'ACTIVE',
  };

  it('documents exactly 4 clear rules for farm monitoring', () => {
    expect(DOCUMENTED_ALERT_RULES.length).toBe(4);
    const codes = DOCUMENTED_ALERT_RULES.map((r) => r.code);
    expect(codes).toContain('LOW_DO');
    expect(codes).toContain('PH_ANOMALY');
    expect(codes).toContain('MORTALITY_SYMPTOMS');
    expect(codes).toContain('STALE_WATER_READING');
  });

  it('Rule 1: Triggers alert when Dissolved Oxygen (DO) is below 3.5 mg/L', () => {
    const lowDoLog: PondLog = {
      id: 'log-do',
      pondId: 'pond-101',
      type: 'WATER_QUALITY',
      recordedAt: new Date().toISOString(),
      dissolvedOxygen: 3.2,
      ph: 7.8,
    };

    const alerts = evaluateAlertsForPond(dummyPond, [lowDoLog], []);
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe('WARNING');
    expect(alerts[0].title).toContain('ออกซิเจนละลายน้ำ (DO) ต่ำ');

    // Extreme DO < 2.5 escalates to CRITICAL
    const criticalDoLog: PondLog = {
      ...lowDoLog,
      dissolvedOxygen: 2.1,
    };
    const criticalAlerts = evaluateAlertsForPond(dummyPond, [criticalDoLog], []);
    expect(criticalAlerts[0].severity).toBe('CRITICAL');
  });

  it('Rule 2: Triggers alert when pH is outside normal range (< 7.0 or > 9.0)', () => {
    const acidicLog: PondLog = {
      id: 'log-ph',
      pondId: 'pond-101',
      type: 'WATER_QUALITY',
      recordedAt: new Date().toISOString(),
      dissolvedOxygen: 5.5,
      ph: 6.6, // Acidic
    };

    const alerts = evaluateAlertsForPond(dummyPond, [acidicLog], []);
    expect(alerts.length).toBe(1);
    expect(alerts[0].title).toContain('สภาพน้ำเป็นกรด');

    const alkalineLog: PondLog = {
      ...acidicLog,
      ph: 9.4, // High alkaline
    };
    const alkalineAlerts = evaluateAlertsForPond(dummyPond, [alkalineLog], []);
    expect(alkalineAlerts[0].title).toContain('สภาพน้ำเป็นด่างสูง');
  });

  it('Rule 3: Triggers alert when mortality or distress symptoms are observed', () => {
    const mortalityLog: PondLog = {
      id: 'log-mortality',
      pondId: 'pond-101',
      type: 'ANIMAL_OBSERVATION',
      recordedAt: new Date().toISOString(),
      mortalityCount: 6,
      observation: 'พบกุ้งลอยหัวริมขอบบ่อช่วงเช้าตรู่',
    };

    const alerts = evaluateAlertsForPond(dummyPond, [mortalityLog], []);
    expect(alerts.length).toBe(1);
    expect(alerts[0].title).toContain('พบสัตว์น้ำตาย (6 ตัว)');
    expect(alerts[0].severity).toBe('CRITICAL');
  });

  it('Rule 4: Triggers info alert when active pond has stale water readings (> 72h)', () => {
    const oldReadingDate = new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(); // 4 days ago
    const staleLog: PondLog = {
      id: 'log-stale',
      pondId: 'pond-101',
      type: 'WATER_QUALITY',
      recordedAt: oldReadingDate,
      dissolvedOxygen: 5.0,
      ph: 7.8,
    };

    const alerts = evaluateAlertsForPond(dummyPond, [staleLog], []);
    const staleAlert = alerts.find((a) =>
      a.title.includes('ไม่มีข้อมูลค่าน้ำล่าสุดเกิน 3 วัน')
    );
    expect(staleAlert).toBeDefined();
    expect(staleAlert?.severity).toBe('INFO');
  });

  it('Deduplication: Prevents duplicate alert spam for the same pond on the same day', () => {
    const lowDoLog: PondLog = {
      id: 'log-do',
      pondId: 'pond-101',
      type: 'WATER_QUALITY',
      recordedAt: new Date().toISOString(),
      dissolvedOxygen: 3.0,
    };

    // First evaluation produces an alert
    const firstRun = evaluateAlertsForPond(dummyPond, [lowDoLog], []);
    expect(firstRun.length).toBe(1);

    // Second evaluation with existing alert prevents re-generating the same alert
    const secondRun = evaluateAlertsForPond(dummyPond, [lowDoLog], firstRun);
    expect(secondRun.length).toBe(0);
  });

  it('Farm level evaluation runs across all ponds cleanly', () => {
    const pond2: Pond = {
      id: 'pond-102',
      farmId: 'farm-1',
      name: 'บ่อ 2 ปูดำธรรมชาติ',
      status: 'ACTIVE',
    };

    const logs: PondLog[] = [
      {
        id: 'l1',
        pondId: 'pond-101',
        type: 'WATER_QUALITY',
        recordedAt: new Date().toISOString(),
        dissolvedOxygen: 2.8,
      },
      {
        id: 'l2',
        pondId: 'pond-102',
        type: 'ANIMAL_OBSERVATION',
        recordedAt: new Date().toISOString(),
        mortalityCount: 2,
      },
    ];

    const farmAlerts = evaluateFarmAlerts([dummyPond, pond2], logs, []);
    expect(farmAlerts.length).toBe(2);
  });
});
