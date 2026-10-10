import { describe, it, expect } from 'vitest';
import {
  normalizeOpenMeteoPayload,
  DEFAULT_SAMUT_SONGKHRAM_STATIONS,
  OpenMeteoCurrentResponse,
} from '../api/_lib/environmental';

describe('Environmental Data Normalization (Milestone 1)', () => {
  const validMockPayload: OpenMeteoCurrentResponse = {
    latitude: 13.4098,
    longitude: 99.9965,
    generationtime_ms: 3.5,
    utc_offset_seconds: 25200,
    timezone: 'Asia/Bangkok',
    current_units: {
      time: 'iso8601',
      temperature_2m: '°C',
      relative_humidity_2m: '%',
      precipitation: 'mm',
      rain: 'mm',
    },
    current: {
      time: '2026-10-10T21:00:00+07:00',
      temperature_2m: 26.5,
      relative_humidity_2m: 92,
      precipitation: 4.2,
      rain: 2.1,
    },
  };

  it('normalizes valid Open-Meteo payload into separate parameters with correct units', () => {
    const fetchedAt = new Date('2026-10-10T21:30:00+07:00');
    const readings = normalizeOpenMeteoPayload(validMockPayload, fetchedAt);

    expect(readings).toHaveLength(4);

    const precip = readings.find((r) => r.parameter === 'precipitation');
    expect(precip).toBeDefined();
    expect(precip?.value).toBe(4.2);
    expect(precip?.unit).toBe('mm');
    expect(precip?.status).toBe('VALID');

    const temp = readings.find((r) => r.parameter === 'temperature');
    expect(temp).toBeDefined();
    expect(temp?.value).toBe(26.5);
    expect(temp?.unit).toBe('°C');

    const rh = readings.find((r) => r.parameter === 'relative_humidity');
    expect(rh).toBeDefined();
    expect(rh?.value).toBe(92);
    expect(rh?.unit).toBe('%');
  });

  it('strictly preserves separation between observedAt and fetchedAt', () => {
    const fetchedAt = new Date('2026-10-10T22:15:00Z');
    const readings = normalizeOpenMeteoPayload(validMockPayload, fetchedAt);

    for (const reading of readings) {
      expect(reading.observedAt.toISOString()).toBe(
        new Date(validMockPayload.current.time).toISOString()
      );
      expect(reading.fetchedAt.toISOString()).toBe(fetchedAt.toISOString());
      expect(reading.observedAt.getTime()).not.toBe(reading.fetchedAt.getTime());
    }
  });

  it('flags data as STALE when observation age exceeds 3 hours', () => {
    // observedAt is 21:00, fetchedAt is 5 hours later (02:00 next day)
    const lateFetchTime = new Date('2026-10-11T02:00:00');
    const readings = normalizeOpenMeteoPayload(validMockPayload, lateFetchTime);

    for (const reading of readings) {
      expect(reading.status).toBe('STALE');
    }
  });

  it('marks suspect readings when values exceed physical limits', () => {
    const payloadWithExtremeValues: OpenMeteoCurrentResponse = {
      ...validMockPayload,
      current: {
        time: '2026-10-10T21:00',
        temperature_2m: 85.0, // Unrealistic temperature
        relative_humidity_2m: 140, // > 100%
        precipitation: -5.0, // Negative rain
        rain: 999.0, // Extreme overflow
      },
    };

    const readings = normalizeOpenMeteoPayload(
      payloadWithExtremeValues,
      new Date('2026-10-10T21:10')
    );
    const temp = readings.find((r) => r.parameter === 'temperature');
    const rh = readings.find((r) => r.parameter === 'relative_humidity');
    const precip = readings.find((r) => r.parameter === 'precipitation');

    expect(temp?.status).toBe('SUSPECT');
    expect(rh?.status).toBe('SUSPECT');
    expect(precip?.status).toBe('SUSPECT');
  });

  it('throws error for malformed or missing payload structures', () => {
    expect(() =>
      normalizeOpenMeteoPayload(null as unknown as OpenMeteoCurrentResponse)
    ).toThrow();
    expect(() =>
      normalizeOpenMeteoPayload({} as unknown as OpenMeteoCurrentResponse)
    ).toThrow();
    expect(() =>
      normalizeOpenMeteoPayload({
        current: { time: 'invalid-date-string' },
      } as unknown as OpenMeteoCurrentResponse)
    ).toThrow();
  });

  it('provides verified candidate stations for Samut Songkhram without hallucinated endpoints', () => {
    expect(DEFAULT_SAMUT_SONGKHRAM_STATIONS.length).toBeGreaterThanOrEqual(4);

    const openMeteoStation = DEFAULT_SAMUT_SONGKHRAM_STATIONS.find(
      (s) => s.provider === 'OPEN_METEO'
    );
    expect(openMeteoStation?.verificationStatus).toBe('VERIFIED');
    expect(openMeteoStation?.latitude).toBeCloseTo(13.41, 1);
    expect(openMeteoStation?.longitude).toBeCloseTo(100.0, 1);

    const navyStation = DEFAULT_SAMUT_SONGKHRAM_STATIONS.find(
      (s) => s.provider === 'NAVY_HYDRO'
    );
    expect(navyStation?.verificationStatus).toBe('CANDIDATE');
    expect(navyStation?.providerStationId).toBe('PAK_NAM_MAE_KLONG_MK');

    const thaiWaterStation = DEFAULT_SAMUT_SONGKHRAM_STATIONS.find(
      (s) => s.provider === 'THAI_WATER'
    );
    expect(thaiWaterStation?.verificationStatus).toBe('BLOCKED');

    const pcdStation = DEFAULT_SAMUT_SONGKHRAM_STATIONS.find(
      (s) => s.provider === 'PCD_IWIS'
    );
    expect(pcdStation?.verificationStatus).toBe('BLOCKED');
  });
});

describe('Minimal Water-Risk Assessment Engine (Milestone 2)', () => {
  const baseStation = {
    provider: 'OPEN_METEO',
    verificationStatus: 'VERIFIED',
    freshness: 'FRESH',
    readings: [
      {
        parameter: 'precipitation',
        value: 0.0,
        observedAt: new Date('2026-10-10T22:00:00Z'),
        status: 'VALID',
      },
    ],
  };

  it('evaluates to "เฝ้าระวัง" (Watch) when current rain >= 10.0mm or forecast >= 25.0mm', async () => {
    const { evaluateWaterRiskSummary } = await import('../api/_lib/environmental');

    const heavyRainStation = {
      ...baseStation,
      readings: [
        {
          parameter: 'precipitation',
          value: 14.5,
          observedAt: new Date('2026-10-10T22:00:00Z'),
          status: 'VALID',
        },
      ],
    };

    const assessment = evaluateWaterRiskSummary({
      stations: [heavyRainStation],
      farm: { waterSourceCanal: 'คลองแม่กลอง' },
      referenceTime: new Date('2026-10-10T22:30:00Z'),
    });

    expect(assessment.statusLabel).toBe('เฝ้าระวัง');
    expect(assessment.badgeTone).toBe('amber');
    expect(assessment.reasons.some((r) => r.includes('14.5'))).toBe(true);
    expect(assessment.recommendedActions.length).toBeGreaterThan(0);
  });

  it('evaluates to "ควรตรวจน้ำ" (Inspect) when light rain is detected (0.1 - 9.9mm)', async () => {
    const { evaluateWaterRiskSummary } = await import('../api/_lib/environmental');

    const lightRainStation = {
      ...baseStation,
      readings: [
        {
          parameter: 'precipitation',
          value: 3.2,
          observedAt: new Date('2026-10-10T22:00:00Z'),
          status: 'VALID',
        },
      ],
    };

    const assessment = evaluateWaterRiskSummary({
      stations: [lightRainStation],
      farm: { waterSourceCanal: 'คลองยายปุก' },
      referenceTime: new Date('2026-10-10T22:30:00Z'),
    });

    expect(assessment.statusLabel).toBe('ควรตรวจน้ำ');
    expect(assessment.badgeTone).toBe('sky');
    expect(assessment.reasons.some((r) => r.includes('3.2'))).toBe(true);
  });

  it('STRICT CONSTRAINT: never returns green "safe" status even when rainfall is 0.0mm', async () => {
    const { evaluateWaterRiskSummary } = await import('../api/_lib/environmental');

    const calmStation = {
      ...baseStation,
      readings: [
        {
          parameter: 'precipitation',
          value: 0.0,
          observedAt: new Date('2026-10-10T22:00:00Z'),
          status: 'VALID',
        },
      ],
    };

    const assessment = evaluateWaterRiskSummary({
      stations: [calmStation],
      farm: { waterSourceCanal: 'คลองท่าแร้ง' },
      referenceTime: new Date('2026-10-10T22:30:00Z'),
    });

    // Must NOT be 'ปลอดภัย' or green badgeTone
    expect(assessment.statusLabel).not.toBe('ปลอดภัย');
    expect(assessment.badgeTone).not.toBe('emerald');
    expect(assessment.badgeTone).not.toBe('green');
    expect(assessment.statusLabel).toBe('ควรตรวจน้ำ');
    expect(assessment.reasons.some((r) => r.includes('ไม่สามารถรับรอง'))).toBe(true);
  });

  it('evaluates to "ข้อมูลเก่า" (Stale) when observation is older than 3 hours', async () => {
    const { evaluateWaterRiskSummary } = await import('../api/_lib/environmental');

    const staleStation = {
      ...baseStation,
      freshness: 'STALE',
      readings: [
        {
          parameter: 'precipitation',
          value: 0.0,
          observedAt: new Date('2026-10-10T15:00:00Z'), // 7 hours old
          status: 'STALE',
        },
      ],
    };

    const assessment = evaluateWaterRiskSummary({
      stations: [staleStation],
      referenceTime: new Date('2026-10-10T22:00:00Z'),
    });

    expect(assessment.statusLabel).toBe('ข้อมูลเก่า');
    expect(assessment.badgeTone).toBe('amber');
    expect(assessment.reasons.some((r) => r.includes('เกินเกณฑ์ความสดใหม่'))).toBe(true);
  });

  it('evaluates to "ข้อมูลไม่เพียงพอ" when verified station has no readings', async () => {
    const { evaluateWaterRiskSummary } = await import('../api/_lib/environmental');

    const emptyStation = {
      ...baseStation,
      readings: [],
    };

    const assessment = evaluateWaterRiskSummary({
      stations: [emptyStation],
    });

    expect(assessment.statusLabel).toBe('ข้อมูลไม่เพียงพอ');
    expect(assessment.badgeTone).toBe('slate');
  });

  it('evaluates to "ยังไม่มีสถานีอ้างอิง" when stations list is empty', async () => {
    const { evaluateWaterRiskSummary } = await import('../api/_lib/environmental');

    const assessment = evaluateWaterRiskSummary({
      stations: [],
    });

    expect(assessment.statusLabel).toBe('ยังไม่มีสถานีอ้างอิง');
    expect(assessment.badgeTone).toBe('slate');
  });
});

describe('Pak Nam Mae Klong Astronomical Tide Prediction (Milestone 2)', () => {
  it('calculates astronomical high and low tide windows with explicit disclaimer', async () => {
    const { predictPakNamMaeKlongTide } = await import('../api/_lib/environmental');

    const tideInfo = predictPakNamMaeKlongTide(new Date('2026-10-10T12:00:00Z'));

    expect(tideInfo.stationCode).toBe('PAK_NAM_MAE_KLONG_MK');
    expect(tideInfo.isAstronomicalPrediction).toBe(true);
    expect(tideInfo.nextHighTide.time).toMatch(/\d{2}:\d{2} น\./);
    expect(tideInfo.nextHighTide.levelMeters).toBeGreaterThan(2.0);
    expect(tideInfo.nextLowTide.time).toMatch(/\d{2}:\d{2} น\./);
    expect(tideInfo.nextLowTide.levelMeters).toBeLessThan(2.0);

    // Strict constraint: Must warn that astronomical prediction is not the canal water level
    expect(tideInfo.caveat).toContain('ไม่ใช่ระดับน้ำจริงในคลองของฟาร์ม');
    expect(tideInfo.caveat).toContain('ดาราศาสตร์');
  });
});
