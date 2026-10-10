import { describe, it, expect } from 'vitest';
import {
  evaluateAlertsForPond,
  evaluateFarmAlerts,
  evaluateEnvironmentalAlerts,
  evaluateAllAlerts,
  DOCUMENTED_ALERT_RULES,
  parseTimeToMinutes,
  getBangkokDateKey,
} from '../src/lib/alerts';
import { evaluateEnvironmentalAlerts as evaluateBackendEnvironmentalAlerts } from '../api/_lib/environmental';
import { Pond, PondLog } from '../src/types';

describe('Milestone 3: Explainable Rules & Alert Deduplication Engine', () => {
  const dummyPond: Pond = {
    id: 'pond-101',
    farmId: 'farm-1',
    name: 'บ่อ 1 กุ้งธรรมชาติ',
    status: 'ACTIVE',
  };

  describe('Documented Rules Metadata', () => {
    it('documents all 7 clear rules separated into Pond and Environmental evidence', () => {
      expect(DOCUMENTED_ALERT_RULES.length).toBe(7);

      const pondRules = DOCUMENTED_ALERT_RULES.filter((r) => r.category === 'POND');
      const envRules = DOCUMENTED_ALERT_RULES.filter((r) => r.category === 'ENVIRONMENTAL');

      expect(pondRules.length).toBe(4);
      expect(envRules.length).toBe(3);

      const codes = DOCUMENTED_ALERT_RULES.map((r) => r.code);
      // Pond rules
      expect(codes).toContain('LOW_DO');
      expect(codes).toContain('PH_ANOMALY');
      expect(codes).toContain('MORTALITY_SYMPTOMS');
      expect(codes).toContain('STALE_WATER_READING');
      // Environmental rules
      expect(codes).toContain('ENV_HEAVY_RAIN');
      expect(codes).toContain('ENV_HIGH_TIDE_WINDOW');
      expect(codes).toContain('ENV_SOURCE_WATER_ANOMALY');
    });

    it('each rule contains human-readable explanation, default severity, and threshold notes', () => {
      for (const rule of DOCUMENTED_ALERT_RULES) {
        expect(rule.name.length).toBeGreaterThan(0);
        expect(rule.description.length).toBeGreaterThan(0);
        expect(['INFO', 'WARNING', 'CRITICAL']).toContain(rule.defaultSeverity);
        expect(rule.thresholdNotes).toBeDefined();
      }
    });
  });

  describe('Pond-Level Evidence Rules', () => {
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
      expect(alerts[0].ruleCode).toBe('LOW_DO');
      expect(alerts[0].sourceObservationTime).toBe(lowDoLog.recordedAt);

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
      expect(alerts[0].ruleCode).toBe('PH_ANOMALY');

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
      expect(alerts[0].ruleCode).toBe('MORTALITY_SYMPTOMS');
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
      expect(staleAlert?.ruleCode).toBe('STALE_WATER_READING');
    });
  });

  describe('Environmental Evidence Rules', () => {
    it('Rule 5 (Heavy Rain): Triggers warning when verified rain >= 10.0 mm/hr', () => {
      const weatherStation = {
        verificationStatus: 'VERIFIED',
        provider: 'OPEN_METEO',
        name: 'สถานีตรวจวัดสภาพอากาศ สมุทรสงคราม',
        freshness: 'FRESH',
        readings: [
          {
            parameter: 'precipitation',
            value: 14.5,
            unit: 'mm',
            observedAt: new Date().toISOString(),
          },
        ],
      };

      const alerts = evaluateEnvironmentalAlerts({
        farmId: 'farm-1',
        weatherStation,
        existingAlerts: [],
      });

      expect(alerts.length).toBe(1);
      expect(alerts[0].ruleCode).toBe('ENV_HEAVY_RAIN');
      expect(alerts[0].severity).toBe('WARNING');
      expect(alerts[0].pondId).toBeNull(); // Must be farm-wide
      expect(alerts[0].title).toContain('ฝนตกหนัก');
      expect(alerts[0].message).toContain('ความเค็มฮวบ');
      expect(alerts[0].message).toContain('หลีกเลี่ยงการเปิดประตูระบายน้ำ');
    });

    it('Rule 5 (Forecast Rain): Triggers warning when 24h precipitation forecast >= 25.0 mm', () => {
      const weatherStation = {
        verificationStatus: 'VERIFIED',
        provider: 'OPEN_METEO',
        freshness: 'FRESH',
        readings: [
          {
            parameter: 'precipitation',
            value: 0.0,
            unit: 'mm',
            observedAt: new Date().toISOString(),
          },
          {
            parameter: 'precipitation_forecast_24h',
            value: 35.0,
            unit: 'mm',
            observedAt: new Date().toISOString(),
          },
        ],
      };

      const alerts = evaluateEnvironmentalAlerts({
        farmId: 'farm-1',
        weatherStation,
        existingAlerts: [],
      });

      expect(alerts.length).toBe(1);
      expect(alerts[0].title).toContain('พยากรณ์ฝนสะสมสูง (35 มม.');
      expect(alerts[0].severity).toBe('WARNING');
    });

    it('Rule 5 (Anti-Complacency / Stale Guard): Never alerts from unverified or stale stations', () => {
      const staleStation = {
        verificationStatus: 'VERIFIED',
        provider: 'OPEN_METEO',
        freshness: 'STALE', // Stale >3h
        readings: [
          {
            parameter: 'precipitation',
            value: 50.0,
            unit: 'mm',
            observedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
          },
        ],
      };

      const alertsStale = evaluateEnvironmentalAlerts({
        farmId: 'farm-1',
        weatherStation: staleStation,
        existingAlerts: [],
      });
      expect(alertsStale.length).toBe(0);

      const candidateStation = {
        verificationStatus: 'CANDIDATE',
        provider: 'MANUAL',
        freshness: 'FRESH',
        readings: [
          {
            parameter: 'precipitation',
            value: 50.0,
            unit: 'mm',
            observedAt: new Date().toISOString(),
          },
        ],
      };

      const alertsCandidate = evaluateEnvironmentalAlerts({
        farmId: 'farm-1',
        weatherStation: candidateStation,
        existingAlerts: [],
      });
      expect(alertsCandidate.length).toBe(0);
    });

    it('Rule 6 (High Tide Window): Triggers reminder when within ±2 hours of peak tide', () => {
      // 12:00 Bangkok time (05:00 UTC)
      const testTime = new Date('2026-10-10T05:00:00Z');

      const tideWindow = {
        dateStr: '2026-10-10',
        nextHighTide: {
          time: '12:30 น.', // 30 minutes from testTime
          levelMeters: 2.95,
          description: 'ช่วงน้ำขึ้นสูงสุด',
        },
        nextLowTide: {
          time: '18:30 น.',
          levelMeters: 1.1,
          description: 'ช่วงน้ำลงต่ำสุด',
        },
      };

      const alerts = evaluateEnvironmentalAlerts({
        farmId: 'farm-1',
        referenceTime: testTime,
        tideWindow,
        existingAlerts: [],
      });

      expect(alerts.length).toBe(1);
      expect(alerts[0].ruleCode).toBe('ENV_HIGH_TIDE_WINDOW');
      expect(alerts[0].severity).toBe('INFO');
      expect(alerts[0].title).toContain('12:30 น.');
      expect(alerts[0].message).toContain('ไม่ใช่ระดับน้ำจริงในคลอง');
      expect(alerts[0].message).toContain('ห้ามตั้งระบบเปิดน้ำอัตโนมัติ');
    });

    it('Rule 6: Does NOT trigger high tide alert when outside the 2-hour window', () => {
      // 06:00 Bangkok time (23:00 UTC previous day)
      const testTime = new Date('2026-10-09T23:00:00Z');

      const tideWindow = {
        dateStr: '2026-10-10',
        nextHighTide: {
          time: '14:00 น.', // 8 hours away
          levelMeters: 2.9,
          description: 'ช่วงน้ำขึ้นสูงสุด',
        },
      };

      const alerts = evaluateEnvironmentalAlerts({
        farmId: 'farm-1',
        referenceTime: testTime,
        tideWindow,
        existingAlerts: [],
      });

      expect(alerts.length).toBe(0);
    });
  });

  describe('Alert Hygiene & Deduplication', () => {
    it('Pond Deduplication: Prevents duplicate alert spam for the same pond on the same day', () => {
      const lowDoLog: PondLog = {
        id: 'log-do',
        pondId: 'pond-101',
        type: 'WATER_QUALITY',
        recordedAt: new Date().toISOString(),
        dissolvedOxygen: 3.0,
      };

      const firstRun = evaluateAlertsForPond(dummyPond, [lowDoLog], []);
      expect(firstRun.length).toBe(1);
      expect(firstRun[0].dedupeKey).toBeDefined();

      // Second run with firstRun's alert prevents duplicates
      const secondRun = evaluateAlertsForPond(dummyPond, [lowDoLog], firstRun);
      expect(secondRun.length).toBe(0);
    });

    it('Environmental Deduplication: Prevents duplicate rain and tide alerts on the same date', () => {
      const weatherStation = {
        verificationStatus: 'VERIFIED',
        provider: 'OPEN_METEO',
        freshness: 'FRESH',
        readings: [
          {
            parameter: 'precipitation',
            value: 20.0,
            unit: 'mm',
            observedAt: new Date().toISOString(),
          },
        ],
      };

      const run1 = evaluateEnvironmentalAlerts({
        farmId: 'farm-1',
        weatherStation,
        existingAlerts: [],
      });
      expect(run1.length).toBe(1);

      const run2 = evaluateEnvironmentalAlerts({
        farmId: 'farm-1',
        weatherStation,
        existingAlerts: run1,
      });
      expect(run2.length).toBe(0);
    });

    it('Unified Alert Engine runs across both ponds and farm environment cleanly', () => {
      const pond2: Pond = {
        id: 'pond-102',
        farmId: 'farm-1',
        name: 'บ่อ 2 ปูดำ',
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
      ];

      const weatherStation = {
        verificationStatus: 'VERIFIED',
        provider: 'OPEN_METEO',
        freshness: 'FRESH',
        readings: [
          {
            parameter: 'precipitation',
            value: 15.0,
            unit: 'mm',
            observedAt: new Date().toISOString(),
          },
        ],
      };

      const farmPondAlerts = evaluateFarmAlerts([dummyPond, pond2], logs, []);
      expect(farmPondAlerts.length).toBe(1);
      expect(farmPondAlerts[0].pondId).toBe('pond-101');

      const allAlerts = evaluateAllAlerts({
        farmId: 'farm-1',
        ponds: [dummyPond, pond2],
        pondLogs: logs,
        weatherStation,
        existingAlerts: [],
      });

      expect(allAlerts.length).toBe(2);
      // Pond alert has pondId
      const pondAlert = allAlerts.find((a) => a.pondId === 'pond-101');
      expect(pondAlert).toBeDefined();
      expect(pondAlert?.ruleCode).toBe('LOW_DO');

      // Environmental alert has pondId = null
      const envAlert = allAlerts.find((a) => a.pondId === null);
      expect(envAlert).toBeDefined();
      expect(envAlert?.ruleCode).toBe('ENV_HEAVY_RAIN');
    });

    it('Backend evaluateEnvironmentalAlerts produces identical contract for API server', () => {
      const weatherStation = {
        verificationStatus: 'VERIFIED',
        provider: 'OPEN_METEO',
        freshness: 'FRESH',
        readings: [
          {
            parameter: 'precipitation',
            value: 22.0,
            unit: 'mm',
            observedAt: new Date().toISOString(),
          },
        ],
      };

      const backendAlerts = evaluateBackendEnvironmentalAlerts({
        farmId: 'farm-1',
        weatherStation,
        existingAlerts: [],
      });

      expect(backendAlerts.length).toBe(1);
      expect(backendAlerts[0].dedupeKey).toContain('ENV_RAIN_farm-1_');
      expect(backendAlerts[0].ruleCode).toBe('ENV_HEAVY_RAIN');
      expect(backendAlerts[0].severity).toBe('WARNING');
    });
  });

  describe('Time and Date Helpers', () => {
    it('parseTimeToMinutes correctly parses Thai time format', () => {
      expect(parseTimeToMinutes('11:45 น.')).toBe(11 * 60 + 45);
      expect(parseTimeToMinutes('00:00 น.')).toBe(0);
      expect(parseTimeToMinutes('23:59')).toBe(23 * 60 + 59);
      expect(parseTimeToMinutes('invalid')).toBeNull();
    });

    it('getBangkokDateKey outputs correct YYYY-MM-DD for Bangkok timezone', () => {
      const key = getBangkokDateKey(new Date('2026-10-10T17:30:00Z')); // 17:30 UTC is 00:30 next day in Bangkok
      expect(key).toBe('2026-10-11');
    });
  });
});
