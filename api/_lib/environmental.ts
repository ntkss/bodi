// บ่อดี (BODI) — Environmental Water Risk Data Services (Milestone 1)
// Handles external provider normalization, freshness checks, and station verification.

export interface NormalizedEnvironmentalReading {
  parameter: string;
  value: number;
  unit: string;
  observedAt: Date;
  fetchedAt: Date;
  status: 'VALID' | 'STALE' | 'UNVERIFIED' | 'SUSPECT';
  sourceRecordId?: string | null;
}

export interface OpenMeteoCurrentResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  current_units: {
    time: string;
    temperature_2m: string;
    relative_humidity_2m: string;
    precipitation: string;
    rain: string;
  };
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    rain: number;
    weather_code?: number;
  };
}

/**
 * Normalizes Open-Meteo current weather payload into BODI EnvironmentalReadings.
 * Strictly separates observedAt (from payload) and fetchedAt (system fetch time).
 * Evaluates freshness: marks as STALE if observation timestamp is > 3 hours old.
 */
export function normalizeOpenMeteoPayload(
  payload: OpenMeteoCurrentResponse,
  fetchedAt: Date = new Date()
): NormalizedEnvironmentalReading[] {
  if (!payload || !payload.current || !payload.current.time) {
    throw new Error('โครงสร้างข้อมูล Open-Meteo ไม่ถูกต้อง');
  }

  const observedAt = new Date(payload.current.time);
  if (isNaN(observedAt.getTime())) {
    throw new Error('รูปแบบเวลา observedAt จากผู้ให้บริการไม่ถูกต้อง');
  }

  // Freshness check: if data timestamp is older than 3 hours, flag as STALE
  const ageHours = (fetchedAt.getTime() - observedAt.getTime()) / (1000 * 60 * 60);
  const isStale = ageHours > 3;
  const baseStatus: 'VALID' | 'STALE' = isStale ? 'STALE' : 'VALID';

  const readings: NormalizedEnvironmentalReading[] = [];

  // 1. Precipitation (ฝนรวม)
  if (typeof payload.current.precipitation === 'number') {
    const val = payload.current.precipitation;
    const isSuspect = val < 0 || val > 500; // Physical boundary check
    readings.push({
      parameter: 'precipitation',
      value: val,
      unit: payload.current_units?.precipitation || 'mm',
      observedAt,
      fetchedAt,
      status: isSuspect ? 'SUSPECT' : baseStatus,
      sourceRecordId: `open-meteo-${payload.current.time}-precip`,
    });
  }

  // 2. Rain (ปริมาณฝนเฉพาะของเหลว)
  if (typeof payload.current.rain === 'number') {
    const val = payload.current.rain;
    const isSuspect = val < 0 || val > 500;
    readings.push({
      parameter: 'rain',
      value: val,
      unit: payload.current_units?.rain || 'mm',
      observedAt,
      fetchedAt,
      status: isSuspect ? 'SUSPECT' : baseStatus,
      sourceRecordId: `open-meteo-${payload.current.time}-rain`,
    });
  }

  // 3. Air Temperature
  if (typeof payload.current.temperature_2m === 'number') {
    const val = payload.current.temperature_2m;
    const isSuspect = val < -10 || val > 65; // Thailand physical bounds
    readings.push({
      parameter: 'temperature',
      value: val,
      unit: payload.current_units?.temperature_2m || '°C',
      observedAt,
      fetchedAt,
      status: isSuspect ? 'SUSPECT' : baseStatus,
      sourceRecordId: `open-meteo-${payload.current.time}-temp`,
    });
  }

  // 4. Relative Humidity
  if (typeof payload.current.relative_humidity_2m === 'number') {
    const val = payload.current.relative_humidity_2m;
    const isSuspect = val < 0 || val > 100;
    readings.push({
      parameter: 'relative_humidity',
      value: val,
      unit: payload.current_units?.relative_humidity_2m || '%',
      observedAt,
      fetchedAt,
      status: isSuspect ? 'SUSPECT' : baseStatus,
      sourceRecordId: `open-meteo-${payload.current.time}-rh`,
    });
  }

  return readings;
}

/**
 * Server-side fetch to Open-Meteo API with timeout and error handling.
 */
export async function fetchOpenMeteoEnvironmentalData(
  latitude: number,
  longitude: number,
  timeoutMs = 8000
): Promise<NormalizedEnvironmentalReading[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code&timezone=Asia%2FBangkok`;

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BODI-Smart-Aquaculture/1.0 (Samut Songkhram Farm Pilot)',
      },
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP Error: ${res.status} ${res.statusText}`);
    }

    const json = (await res.json()) as OpenMeteoCurrentResponse;
    const fetchedAt = new Date();
    return normalizeOpenMeteoPayload(json, fetchedAt);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Default candidate stations for Samut Songkhram aquaculture region
 */
export const DEFAULT_SAMUT_SONGKHRAM_STATIONS = [
  {
    provider: 'OPEN_METEO',
    providerStationId: 'open-meteo-samut-songkhram',
    name: 'สถานีตรวจวัดสภาพอากาศ สมุทรสงคราม (Open-Meteo)',
    sourceUrl: 'https://open-meteo.com/en/docs',
    latitude: 13.4098,
    longitude: 99.9965,
    parameters: 'precipitation,rain,temperature,relative_humidity',
    units: 'mm, °C, %',
    relevanceNotes:
      'ข้อมูลฝนและสภาพอากาศในพื้นที่สมุทรสงคราม ใช้เฝ้าระวังฝนชะหน้าดินและความเค็มลดลงกระทันหัน (ฟรีเพื่อการศึกษา/ทดสอบแบบ non-commercial <10,000 ครั้ง/วัน อ้างอิง CC BY 4.0)',
    verificationStatus: 'VERIFIED',
  },
  {
    provider: 'NAVY_HYDRO',
    providerStationId: 'PAK_NAM_MAE_KLONG_MK',
    name: 'สถานีมาตราน้ำปากน้ำแม่กลอง (กรมอุทกศาสตร์ กองทัพเรือ)',
    sourceUrl: 'https://hydro.navy.mi.th/waterlaveltable',
    latitude: 13.355,
    longitude: 100.005,
    parameters: 'tide_prediction',
    units: 'm (LLW / MSL)',
    relevanceNotes:
      'มาตราน้ำทำนายรายปีทางดาราศาสตร์บริเวณปากอ่าวแม่กลอง สำหรับวางแผนจังหวะเปิด-ปิดประตูระบายน้ำ (ข้อควรระวัง: เป็นระดับน้ำทำนาย ไม่ใช่ระดับน้ำตรวจวัดจริงในคลองซอย)',
    verificationStatus: 'CANDIDATE',
  },
  {
    provider: 'THAI_WATER',
    providerStationId: 'HII_MAE_KLONG',
    name: 'สถาบันสารสนเทศทรัพยากรน้ำ (สสน. / ThaiWater)',
    sourceUrl: 'https://standard.thaiwater.net',
    latitude: 13.41,
    longitude: 99.99,
    parameters: 'rainfall,water_level,runoff',
    units: 'mm, m (MSL)',
    relevanceNotes:
      'มาตรฐานการแลกเปลี่ยนข้อมูลน้ำภาครัฐ ไม่มี Public REST API สาธารณะสำหรับแอปพลิเคชันบุคคลที่สามโดยไม่มีข้อตกลงร่วม (MoU) สถานะปัจจุบันถูกระงับการเชื่อมต่อตรง',
    verificationStatus: 'BLOCKED',
  },
  {
    provider: 'PCD_IWIS',
    providerStationId: 'PCD_IWIS_MAE_KLONG',
    name: 'กรมควบคุมมลพิษ IWIS (แม่น้ำแม่กลองตอนล่าง)',
    sourceUrl: 'https://iwis.pcd.go.th',
    latitude: 13.38,
    longitude: 99.99,
    parameters: 'dissolved_oxygen,salinity,ph',
    units: 'mg/L, ppt',
    relevanceNotes:
      'ระบบติดตามคุณภาพน้ำผิวดิน ให้บริการเฉพาะหน้าเว็บแดชบอร์ด ไม่มี Documented Open API สาธารณะที่ใช้งานได้สำหรับแอปทั่วไป',
    verificationStatus: 'BLOCKED',
  },
];
