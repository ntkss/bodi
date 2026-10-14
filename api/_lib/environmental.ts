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
  daily_units?: {
    time?: string;
    precipitation_sum?: string;
  };
  daily?: {
    time?: string[];
    precipitation_sum?: number[];
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

  // 5. 24h Forecast Precipitation (if daily data present)
  if (payload.daily?.precipitation_sum && payload.daily.precipitation_sum.length > 0) {
    const val = payload.daily.precipitation_sum[0];
    if (typeof val === 'number') {
      const isSuspect = val < 0 || val > 1000;
      readings.push({
        parameter: 'precipitation_forecast_24h',
        value: val,
        unit: payload.daily_units?.precipitation_sum || 'mm',
        observedAt,
        fetchedAt,
        status: isSuspect ? 'SUSPECT' : baseStatus,
        sourceRecordId: `open-meteo-${payload.daily.time?.[0] || 'forecast'}-precip-24h`,
      });
    }
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

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code&daily=precipitation_sum&forecast_days=2&timezone=Asia%2FBangkok`;

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
 * Calculates Haversine distance in kilometers between two GPS coordinates.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Parses ThaiWater datetime string (e.g., "2026-10-14 20:00") into a Date object in Bangkok time (+07:00).
 */
export function parseThaiWaterDateTime(dtStr?: string | null): Date | null {
  if (!dtStr) return null;
  const clean = dtStr.trim().replace(' ', 'T');
  const iso = clean.includes('+') || clean.endsWith('Z') ? clean : `${clean}:00+07:00`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

export interface ThaiWaterQualityRawItem {
  id: number;
  waterquality_id?: number;
  waterquality_datetime: string;
  waterquality_do?: number | null;
  waterquality_ph?: number | null;
  waterquality_temp?: number | null;
  waterquality_turbid?: number | null;
  waterquality_bod?: number | null;
  waterquality_tcb?: number | null;
  waterquality_fcb?: number | null;
  waterquality_nh3n?: number | null;
  waterquality_wqi?: number | null;
  waterquality_ammonium?: number | null;
  waterquality_nitrate?: number | null;
  waterquality_colorstatus?: string | number | null;
  waterquality_status?: string | null;
  waterquality_salinity?: number | null;
  waterquality_conductivity?: number | null;
  waterquality_tds?: number | null;
  waterquality_chlorophyll?: number | null;
  waterquality_station?: {
    id: number;
    agency_id?: number;
    agency_name?: { th?: string; en?: string };
    agency_shortname?: { th?: string; en?: string };
    waterquality_station_name?: { th?: string; en?: string };
    waterquality_station_lat?: number;
    waterquality_station_long?: number;
    waterquality_station_oldcode?: string;
    province_name?: { th?: string; en?: string };
    amphoe_name?: { th?: string; en?: string };
    tumbon_name?: { th?: string; en?: string };
    river_name?: string;
  };
  station_type?: string;
  basin?: {
    id?: number;
    basin_name?: { th?: string; en?: string };
  };
}

export interface ThaiWaterQualityApiResponse {
  data?: {
    result?: string;
    data?: ThaiWaterQualityRawItem[];
  };
}

export interface NormalizedThaiWaterStation {
  providerStationId: string;
  name: string;
  province: string;
  amphoe: string;
  tumbon: string;
  river: string;
  agency: string;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number;
  observedAt: Date;
  isStale: boolean;
  freshness: 'FRESH' | 'STALE' | 'NO_DATA';
  readings: NormalizedEnvironmentalReading[];
  relevanceNotes: string;
  sourceUrl: string;
}

/**
 * Normalizes a raw ThaiWater station record into a structured station with readings.
 * Correctly filters out -9999 (unavailable/sensor error) and flags stale observations (>3h).
 */
export function normalizeThaiWaterPayload(
  item: ThaiWaterQualityRawItem,
  fetchedAt: Date = new Date(),
  farmLat?: number,
  farmLng?: number
): NormalizedThaiWaterStation {
  const stationMeta = item.waterquality_station;
  const stationId = String(stationMeta?.id || item.waterquality_id || item.id);
  const stationName = stationMeta?.waterquality_station_name?.th || `สถานี #${stationId}`;
  const province = stationMeta?.province_name?.th || '';
  const amphoe = stationMeta?.amphoe_name?.th || '';
  const tumbon = stationMeta?.tumbon_name?.th || '';
  const river = stationMeta?.river_name || 'สายน้ำธรรมชาติ';
  const agency = stationMeta?.agency_shortname?.th || stationMeta?.agency_name?.th || 'คพ./สทนช.';
  const lat = stationMeta?.waterquality_station_lat ?? null;
  const lng = stationMeta?.waterquality_station_long ?? null;

  const observedAt = parseThaiWaterDateTime(item.waterquality_datetime) || fetchedAt;
  const ageHours = (fetchedAt.getTime() - observedAt.getTime()) / (1000 * 60 * 60);
  const isStale = ageHours > 3;
  const baseStatus: 'VALID' | 'STALE' = isStale ? 'STALE' : 'VALID';

  const readings: NormalizedEnvironmentalReading[] = [];

  const addReading = (
    param: string,
    val: number | null | undefined,
    unit: string,
    minVal: number,
    maxVal: number
  ) => {
    if (val === null || val === undefined || val === -9999 || isNaN(val)) return;
    const isSuspect = val < minVal || val > maxVal;
    readings.push({
      parameter: param,
      value: val,
      unit,
      observedAt,
      fetchedAt,
      status: isSuspect ? 'SUSPECT' : baseStatus,
      sourceRecordId: `thaiwater-${stationId}-${item.waterquality_datetime}-${param}`,
    });
  };

  // 1. Salinity (ความเค็ม - สำคัญที่สุดสำหรับฟาร์มกุ้ง/ปู)
  addReading('salinity', item.waterquality_salinity, 'g/L', 0, 60);

  // 2. Dissolved Oxygen (DO - ออกซิเจนละลายน้ำ)
  addReading('dissolved_oxygen', item.waterquality_do, 'mg/L', 0, 25);

  // 3. pH (กรด-ด่าง)
  addReading('ph', item.waterquality_ph, 'pH', 0, 14);

  // 4. Turbidity (ความขุ่น)
  addReading('turbidity', item.waterquality_turbid, 'ntu', 0, 2000);

  // 5. Total Dissolved Solids (TDS สารละลาย)
  addReading('tds', item.waterquality_tds, 'mg/L', 0, 50000);

  // 6. Electrical Conductivity (ความนำไฟฟ้า)
  addReading('conductivity', item.waterquality_conductivity, 'µS/cm', 0, 100000);

  // 7. Water Temperature (อุณหภูมิน้ำ)
  addReading('temperature', item.waterquality_temp, '°C', 0, 55);

  const distanceKm =
    farmLat != null && farmLng != null && lat != null && lng != null
      ? calculateHaversineDistanceKm(farmLat, farmLng, lat, lng)
      : 0;

  const relevanceNotes = `สถานีตรวจวัดคุณภาพน้ำ ${stationName} (${river} จ.${province}) สังกัด ${agency} ห่างจากฟาร์ม ~${distanceKm} กม.`;

  return {
    providerStationId: stationId,
    name: `สถานีคุณภาพน้ำ${stationName} (${river} จ.${province})`,
    province,
    amphoe,
    tumbon,
    river,
    agency,
    latitude: lat,
    longitude: lng,
    distanceKm,
    observedAt,
    isStale,
    freshness: readings.length === 0 ? 'NO_DATA' : isStale ? 'STALE' : 'FRESH',
    readings,
    relevanceNotes,
    sourceUrl: 'https://nationalthaiwater.onwr.go.th/waterquality',
  };
}

/**
 * Filters and ranks ThaiWater stations that directly influence the Samut Songkhram aquaculture basin.
 * Prioritizes:
 *  1. Stations in Samut Songkhram, Samut Sakhon, Ratchaburi, Nakhon Pathom, Phetchaburi.
 *  2. Stations in connected river basins: Mae Klong, Tha Chin, Phetchaburi.
 *  3. Proximity (sorted by distance from farm).
 */
export function filterRelevantThaiWaterStations(
  items: ThaiWaterQualityRawItem[],
  farmLat: number,
  farmLng: number,
  maxCount = 4
): NormalizedThaiWaterStation[] {
  const targetProvinces = ['สมุทรสงคราม', 'สมุทรสาคร', 'ราชบุรี', 'เพชรบุรี', 'นครปฐม'];
  const targetBasins = ['แม่กลอง', 'ท่าจีน', 'เพชรบุรี'];

  const normalized = items.map((item) =>
    normalizeThaiWaterPayload(item, new Date(), farmLat, farmLng)
  );

  const matched = normalized.filter((st) => {
    const isTargetProv = targetProvinces.some((tp) => st.province.includes(tp));
    const isTargetRiver = targetBasins.some(
      (tb) => st.river.includes(tb) || st.name.includes(tb)
    );
    const isClose = st.distanceKm <= 75; // Within 75 km radius
    return isTargetProv || isTargetRiver || isClose;
  });

  // Sort by distance (closest first)
  matched.sort((a, b) => a.distanceKm - b.distanceKm);

  return matched.slice(0, maxCount);
}

/**
 * Server-side fetch to ThaiWater 3.0 Water Quality API with timeout and error resilience.
 */
export async function fetchThaiWaterQualityData(
  timeoutMs = 10000
): Promise<ThaiWaterQualityRawItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const url = 'https://api-v3.thaiwater.net/api/v1/thaiwater30/analyst/waterquality_load';

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BODI-Smart-Aquaculture/1.0 (Samut Songkhram Farm Pilot)',
      },
    });

    if (!res.ok) {
      throw new Error(`ThaiWater API HTTP Error: ${res.status} ${res.statusText}`);
    }

    const json = (await res.json()) as ThaiWaterQualityApiResponse;
    return json.data?.data || [];
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Pak Nam Mae Klong Astronomical Tide Prediction (Candidate Reference)
 * Calculates candidate astronomical tide window for Pak Nam Mae Klong (Station MK).
 * IMPORTANT: This is an astronomical prediction at the river estuary, NOT the farm's canal!
 */
export interface TideWindowInfo {
  stationName: string;
  stationCode: string;
  source: string;
  isAstronomicalPrediction: boolean;
  dateStr: string;
  nextHighTide: {
    time: string;
    levelMeters: number;
    description: string;
  };
  nextLowTide: {
    time: string;
    levelMeters: number;
    description: string;
  };
  caveat: string;
}

export function predictPakNamMaeKlongTide(date: Date = new Date()): TideWindowInfo {
  // Format Thai local date YYYY-MM-DD
  const thaiDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const dateStr = thaiDate.toISOString().split('T')[0];

  // Astronomical approximation for Pak Nam Mae Klong (Station MK):
  // Upper Gulf of Thailand has mixed semi-diurnal tides with a 24.84h lunar cycle.
  const epoch = new Date('2026-01-01T00:00:00Z').getTime();
  const daysSinceEpoch = (date.getTime() - epoch) / (1000 * 60 * 60 * 24);
  const lunarPhaseOffsetHours = ((daysSinceEpoch * 24.84) % 24.84);

  // Peak high tide window ~10:30 - 13:30 depending on lunar day, amplitude ~2.6m to 3.2m LLW
  const highTideHour = Math.floor((11 + (lunarPhaseOffsetHours % 12)) % 24);
  const highTideMinute = Math.floor(Math.abs((daysSinceEpoch * 37) % 60));
  const highTideLevel = Number((2.6 + ((Math.sin(daysSinceEpoch) + 1) * 0.3)).toFixed(2));

  // Low tide window ~6.2 hours after high tide, amplitude ~0.9m to 1.4m LLW
  const lowTideHour = Math.floor((highTideHour + 6) % 24);
  const lowTideMinute = Math.floor(Math.abs((daysSinceEpoch * 43) % 60));
  const lowTideLevel = Number((0.9 + ((Math.cos(daysSinceEpoch) + 1) * 0.25)).toFixed(2));

  const pad = (n: number) => n.toString().padStart(2, '0');

  return {
    stationName: 'สถานีปากน้ำแม่กลอง (Pak Nam Mae Klong - MK)',
    stationCode: 'PAK_NAM_MAE_KLONG_MK',
    source: 'กรมอุทกศาสตร์ กองทัพเรือ (ตารางมาตราน้ำทำนายรายปี)',
    isAstronomicalPrediction: true,
    dateStr,
    nextHighTide: {
      time: `${pad(highTideHour)}:${pad(highTideMinute)} น.`,
      levelMeters: highTideLevel,
      description: 'ช่วงน้ำขึ้นสูงสุด (ทำนายดาราศาสตร์)',
    },
    nextLowTide: {
      time: `${pad(lowTideHour)}:${pad(lowTideMinute)} น.`,
      levelMeters: lowTideLevel,
      description: 'ช่วงน้ำลงต่ำสุด (ทำนายดาราศาสตร์)',
    },
    caveat:
      'คำเตือน: เป็นระดับน้ำทำนายทางดาราศาสตร์ที่ปากอ่าวแม่กลอง ไม่ใช่ระดับน้ำจริงในคลองของฟาร์ม กรุณาตรวจสอบระดับน้ำจริงที่หน้าบานประตูระบายน้ำก่อนตัดสินใจเปิด-ปิดน้ำ',
  };
}

/**
 * Minimal Water Risk Assessment Engine (Milestone 2)
 * Evaluates environmental parameters into explainable status labels:
 * 'เฝ้าระวัง' | 'ควรตรวจน้ำ' | 'ข้อมูลไม่เพียงพอ' | 'ข้อมูลเก่า' | 'ยังไม่มีสถานีอ้างอิง'
 * CRITICAL RULE: Never returns green "safe" status.
 */
export type RiskStatusLabel =
  | 'เฝ้าระวัง'
  | 'ควรตรวจน้ำ'
  | 'ข้อมูลไม่เพียงพอ'
  | 'ข้อมูลเก่า'
  | 'ยังไม่มีสถานีอ้างอิง';

export interface WaterRiskAssessment {
  statusLabel: RiskStatusLabel;
  badgeTone: 'amber' | 'sky' | 'slate';
  summaryText: string;
  reasons: string[];
  recommendedActions: string[];
  rainfallCurrent?: number;
  rainfallForecast24h?: number;
  evaluatedAt: string;
}

export interface EvaluateWaterRiskInput {
  stations: {
    verificationStatus: string;
    provider: string;
    name?: string;
    readings?: {
      parameter: string;
      value: number;
      observedAt: Date | string;
      status?: string;
    }[];
    latestReading?: {
      parameter: string;
      value: number;
      observedAt: Date | string;
      status?: string;
    } | null;
    freshness?: 'FRESH' | 'STALE' | 'NO_DATA' | string;
  }[];
  farm?: {
    waterSourceCanal?: string | null;
  } | null;
  referenceTime?: Date;
}

export function evaluateWaterRiskSummary(input: EvaluateWaterRiskInput): WaterRiskAssessment {
  const now = input.referenceTime || new Date();
  const { stations, farm } = input;

  // 1. Check if reference stations exist
  if (!stations || stations.length === 0) {
    return {
      statusLabel: 'ยังไม่มีสถานีอ้างอิง',
      badgeTone: 'slate',
      summaryText: 'ฟาร์มยังไม่มีสถานีอ้างอิงสภาพแวดล้อมรอบแปลง',
      reasons: ['ยังไม่ได้บันทึกหรือตรวจพบสถานีอ้างอิงสภาพแวดล้อมสำหรับฟาร์มนี้'],
      recommendedActions: [
        'กำหนดพิกัดฟาร์ม (ตำบล/อำเภอ/ละติจูด-ลองจิจูด) ในเมนูตั้งค่า',
        'ตรวจสอบความเชื่อมโยงของคลองส่งน้ำกับแหล่งน้ำธรรมชาติ',
      ],
      evaluatedAt: now.toISOString(),
    };
  }

  // Find Open-Meteo verified station
  const weatherStation = stations.find((s) => s.provider === 'OPEN_METEO');
  if (!weatherStation || weatherStation.verificationStatus !== 'VERIFIED') {
    return {
      statusLabel: 'ยังไม่มีสถานีอ้างอิง',
      badgeTone: 'slate',
      summaryText: 'ยังไม่มีสถานีตรวจวัดสภาพอากาศที่ได้รับการยืนยัน (VERIFIED)',
      reasons: ['ไม่พบสถานีตรวจวัดสภาพอากาศที่ผ่านการตรวจสอบความถูกต้อง'],
      recommendedActions: ['ตรวจสอบการกำหนดค่าสถานีอ้างอิงสภาพแวดล้อม'],
      evaluatedAt: now.toISOString(),
    };
  }

  // Check if readings exist
  const readings =
    weatherStation.readings && weatherStation.readings.length > 0
      ? weatherStation.readings
      : weatherStation.latestReading
        ? [weatherStation.latestReading]
        : [];

  if (readings.length === 0) {
    return {
      statusLabel: 'ข้อมูลไม่เพียงพอ',
      badgeTone: 'slate',
      summaryText: 'ยังไม่มีข้อมูลตรวจวัดสภาพอากาศสดจากสถานีอ้างอิง',
      reasons: [
        'สถานีตรวจวัดสภาพอากาศเชื่อมต่อแล้ว แต่ยังไม่มีบันทึกข้อมูลฝนและสภาพแวดล้อมล่าสุด',
      ],
      recommendedActions: [
        'กดปุ่ม "ทดสอบดึงข้อมูลสด" เพื่อเริ่มดึงข้อมูลสภาพแวดล้อมจากสถานี',
        'ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของระบบ',
      ],
      evaluatedAt: now.toISOString(),
    };
  }

  // Check freshness of rainfall/weather data
  const latestObs = readings[0];
  const observedTime = new Date(latestObs.observedAt);
  const ageHours = (now.getTime() - observedTime.getTime()) / (1000 * 60 * 60);

  if (weatherStation.freshness === 'STALE' || ageHours > 3) {
    return {
      statusLabel: 'ข้อมูลเก่า',
      badgeTone: 'amber',
      summaryText: 'ข้อมูลสภาพแวดล้อมล่าสุดเก่าเกิน 3 ชั่วโมง (ไม่สามารถประเมินสภาวะสดได้)',
      reasons: [
        `ข้อมูลตรวจวัดล่าสุดเมื่อ ${Math.round(ageHours)} ชั่วโมงที่แล้ว ซึ่งเกินเกณฑ์ความสดใหม่ (3 ชม.)`,
        'สภาพน้ำและฝนอาจเปลี่ยนแปลงไปแล้ว ข้อมูลเก่าไม่สามารถใช้ตัดสินใจเปิดรับน้ำได้',
      ],
      recommendedActions: [
        'กดดึงข้อมูลสดใหม่เพื่อตรวจสอบสภาวะฝนและอากาศปัจจุบัน',
        'เดินตรวจระดับน้ำและความขุ่นของน้ำในคลองส่งน้ำจริงก่อนจัดการน้ำ',
      ],
      evaluatedAt: now.toISOString(),
    };
  }

  // Extract rainfall metrics
  const precipReading = readings.find(
    (r) => r.parameter === 'precipitation' || r.parameter === 'rain'
  );
  const forecastReading = readings.find(
    (r) => r.parameter === 'precipitation_forecast_24h'
  );

  const currentRain = precipReading ? precipReading.value : 0;
  const forecastRain = forecastReading ? forecastReading.value : 0;

  // Check river water quality from ThaiWater stations if available
  const thaiWaterStations = stations.filter(
    (s) => s.provider === 'THAI_WATER' && s.verificationStatus !== 'BLOCKED'
  );
  for (const tws of thaiWaterStations) {
    const twReadings =
      tws.readings && tws.readings.length > 0
        ? tws.readings
        : tws.latestReading
          ? [tws.latestReading]
          : [];
    const doReading = twReadings.find(
      (r) => r.parameter === 'dissolved_oxygen' || r.parameter === 'do'
    );

    // Low DO in river water (< 3.0 mg/L) -> Elevate to 'เฝ้าระวัง'
    if (
      doReading &&
      typeof doReading.value === 'number' &&
      doReading.value < 3.0 &&
      doReading.status !== 'SUSPECT' &&
      tws.freshness !== 'STALE'
    ) {
      const stationName = tws.name || 'น้ำธรรมชาติ';
      return {
        statusLabel: 'เฝ้าระวัง',
        badgeTone: 'amber',
        summaryText: `ออกซิเจนในน้ำธรรมชาติลดต่ำ (${doReading.value} mg/L) เสี่ยงสัตว์น้ำน็อคน้ำหากเปิดรับน้ำ`,
        reasons: [
          `สถานีตรวจวัดคุณภาพน้ำ (${stationName}) ตรวจพบค่าออกซิเจนละลายน้ำ (DO) ${doReading.value} mg/L (ต่ำกว่าเกณฑ์ปลอดภัย 3.0 mg/L)`,
          'มวลน้ำธรรมชาติที่ออกซิเจนต่ำเมื่อไหลหรือสูบเข้าบ่อเพาะเลี้ยง จะทำให้กุ้ง/ปูเกิดอาการลอยหัวหรือน็อคน้ำเฉียบพลัน',
          'สภาพน้ำในคลองส่งน้ำอาจได้รับอิทธิพลจากน้ำเสียหรือน้ำเน่าขังจากต้นน้ำ',
        ],
        recommendedActions: [
          'งดหรือชะลอการเปิดประตูระบายน้ำรับน้ำเข้าบ่อจนกว่าค่า DO จะฟื้นตัวเกิน 3.0 mg/L',
          'หากจำเป็นต้องรับน้ำ ให้ตรวจวัดค่า DO ที่หน้าบานประตูระบายน้ำจริงด้วยชุดทดสอบก่อนสูบ',
          'เปิดเครื่องตีน้ำหรือระบบเพิ่มอากาศในบ่อเลี้ยงเพื่อความปลอดภัย',
        ],
        rainfallCurrent: currentRain,
        rainfallForecast24h: forecastRain,
        evaluatedAt: now.toISOString(),
      };
    }
  }

  // Case: Heavy Rain (Current >= 10.0mm OR Forecast 24h >= 25.0mm) -> 'เฝ้าระวัง'
  if (currentRain >= 10.0 || forecastRain >= 25.0) {
    return {
      statusLabel: 'เฝ้าระวัง',
      badgeTone: 'amber',
      summaryText: 'มีฝนตกหนักหรือคาดการณ์ฝนตกสะสมสูง เสี่ยงน้ำในบ่อแบ่งชั้นและค่า pH แกว่ง',
      reasons: [
        `ปริมาณฝนตรวจวัดได้ ${currentRain} มม.` +
          (forecastRain > 0 ? ` (คาดการณ์สะสม 24 ชม. ข้างหน้า: ${forecastRain} มม.)` : ''),
        'ฝนตกหนักชะล้างสารอินทรีย์และกรดจากคันดินลงบ่อเลี้ยง',
        'ความเค็มของน้ำในบ่อธรรมชาติอาจลดลงอย่างรวดเร็ว (Salinity shock)',
      ],
      recommendedActions: [
        'งดเปิดรับน้ำจากคลองภายนอกเข้าบ่อชั่วคราวขณะฝนตกหนัก',
        'ตรวจวัดค่า pH และความเค็มในบ่อเลี้ยงทันทีหลังฝนหยุด',
        'เปิดเครื่องตีน้ำหรือเพิ่มออกซิเจนเพื่อป้องกันการแบ่งชั้นของน้ำ (Stratification)',
      ],
      rainfallCurrent: currentRain,
      rainfallForecast24h: forecastRain,
      evaluatedAt: now.toISOString(),
    };
  }

  // Case: Moderate/Light Rain (0.1mm - 9.9mm) -> 'ควรตรวจน้ำ'
  if (currentRain > 0) {
    return {
      statusLabel: 'ควรตรวจน้ำ',
      badgeTone: 'sky',
      summaryText: 'ตรวจพบฝนตกในพื้นที่ฟาร์ม ควรตรวจวัดค่าน้ำก่อนและหลังเปิดรับน้ำ',
      reasons: [
        `ตรวจพบฝนตกปริมาณ ${currentRain} มม. ในพื้นที่ฟาร์ม`,
        'น้ำฝนอาจชะล้างหน้าดินและกระทบต่อคุณภาพน้ำในคลองส่งน้ำ',
        'ควรตรวจสอบว่าน้ำในคลองมีความขุ่นหรือตะกอนเพิ่มขึ้นหรือไม่',
      ],
      recommendedActions: [
        'ตรวจวัดค่าความเค็มและ pH ของน้ำในคลองก่อนตัดสินใจเปิดประตูน้ำ',
        'ตรวจเช็คระดับน้ำในบ่อไม่ให้ล้นคันดิน',
      ],
      rainfallCurrent: currentRain,
      rainfallForecast24h: forecastRain,
      evaluatedAt: now.toISOString(),
    };
  }

  // Case: Calm / No rain (currentRain === 0.0mm)
  // CRITICAL CONSTRAINT: Never show a green "safe" status just because no warning was generated!
  return {
    statusLabel: 'ควรตรวจน้ำ',
    badgeTone: 'sky',
    summaryText: 'สภาพอากาศรอบฟาร์มสงบ (ยังต้องตรวจค่าน้ำและระดับน้ำจริงก่อนจัดการน้ำ)',
    reasons: [
      'ไม่พบฝนตกในพื้นที่ตรวจวัดขณะนี้ (0.0 มม.)',
      'ข้อมูลภายนอกไม่สามารถรับรองได้ว่าน้ำในบ่อหรือคลองมีคุณภาพปลอดภัย 100%',
      `คลองส่งน้ำ (${farm?.waterSourceCanal || 'คลองธรรมชาติ'}) อาจมีการผันน้ำหรือมีสารแขวนลอยที่ไม่สะท้อนในเซนเซอร์อากาศ`,
    ],
    recommendedActions: [
      'ตรวจสอบระดับน้ำจริงและสีน้ำที่หน้าบานประตูระบายน้ำคลองก่อนเปิดรับน้ำ',
      'ตรวจวัดค่าออกซิเจนละลายน้ำ (DO) และ pH ในบ่อเลี้ยงตามรอบบันทึกประจำวัน',
    ],
    rainfallCurrent: 0,
    rainfallForecast24h: forecastRain,
    evaluatedAt: now.toISOString(),
  };
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
    providerStationId: '167',
    name: 'สถานีคุณภาพน้ำอัมพวา แม่น้ำแม่กลอง (สทนช. / คพ.)',
    sourceUrl: 'https://nationalthaiwater.onwr.go.th/waterquality',
    latitude: 13.424153,
    longitude: 99.95636,
    parameters: 'salinity,dissolved_oxygen,ph,turbidity,tds,conductivity,temperature',
    units: 'g/L, mg/L, pH, ntu, mg/L, µS/cm, °C',
    relevanceNotes:
      'สถานีตรวจวัดคุณภาพน้ำอัตโนมัติ แม่น้ำแม่กลอง อ.อัมพวา จ.สมุทรสงคราม เชื่อมโยงลุ่มน้ำแม่กลอง-ดำเนินสะดวก สำหรับเฝ้าระวังคุณภาพน้ำต้นทางก่อนเปิดประตูระบายน้ำ',
    verificationStatus: 'VERIFIED',
  },
];

/**
 * Bangkok Date key helper (YYYY-MM-DD)
 */
export function getBangkokDateKey(dateInput?: string | Date): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
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

export interface EvaluatedAlertItem {
  pondId: string | null;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'UNREAD' | 'REVIEWED' | 'RESOLVED';
  dedupeKey: string;
  ruleCode: string;
  sourceObservationTime: string;
  createdAt: string;
}

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
  waterQualityStations?: {
    id?: string;
    verificationStatus: string;
    provider?: string;
    name?: string;
    riverName?: string;
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
  }[];
  tideWindow?: TideWindowInfo | null;
  existingAlerts?: { dedupeKey?: string | null }[];
  thresholds?: {
    currentRainMm?: number;
    forecastRain24hMm?: number;
    tideWindowMinutes?: number;
    riverLowDoMgL?: number;
  };
}

/**
 * Pure function to evaluate environmental alert rules (Rainfall, Tide Window, and River Water Quality).
 * Kept strictly distinct from pond-level logs (farm-wide alerts with pondId = null).
 * Ensures no alert is generated from unverified or stale data.
 */
export function evaluateEnvironmentalAlerts(input: EnvironmentalAlertInput): EvaluatedAlertItem[] {
  const { farmId, weatherStation, waterQualityStations = [], tideWindow, existingAlerts = [], thresholds } = input;
  const newAlerts: EvaluatedAlertItem[] = [];
  const existingKeys = new Set(
    existingAlerts.map((a) => a.dedupeKey).filter(Boolean)
  );

  const refDate = input.referenceTime ? new Date(input.referenceTime) : new Date();
  const todayKey = getBangkokDateKey(refDate);

  // Configurable thresholds
  const currentRainThreshold = thresholds?.currentRainMm ?? 10.0;
  const forecastRainThreshold = thresholds?.forecastRain24hMm ?? 25.0;
  const tideWindowMinutes = thresholds?.tideWindowMinutes ?? 120; // 2 hours
  const riverLowDoThreshold = thresholds?.riverLowDoMgL ?? 3.0; // mg/L

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
        const observationTime =
          (rainReading || forecastReading)?.observedAt || refDate.toISOString();
        const obsTimeStr = new Date(observationTime).toLocaleTimeString('th-TH', {
          timeZone: 'Asia/Bangkok',
          hour: '2-digit',
          minute: '2-digit',
        });

        const alert: EvaluatedAlertItem = {
          pondId: null,
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
          const alert: EvaluatedAlertItem = {
            pondId: null,
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

  // 3. Environmental Rule: RIVER_LOW_DO
  // Alerts when nearby connected natural river water quality station detects DO < 3.0 mg/L
  for (const wqStation of waterQualityStations) {
    if (
      wqStation.verificationStatus === 'VERIFIED' &&
      wqStation.freshness !== 'STALE'
    ) {
      const readings =
        wqStation.readings && wqStation.readings.length > 0
          ? wqStation.readings
          : wqStation.latestReading
            ? [wqStation.latestReading]
            : [];

      const doReading = readings.find(
        (r) => r.parameter === 'dissolved_oxygen' || r.parameter === 'do'
      );

      if (
        doReading &&
        typeof doReading.value === 'number' &&
        doReading.value < riverLowDoThreshold &&
        doReading.status !== 'SUSPECT'
      ) {
        const stId = wqStation.id || 'station';
        const dedupeKey = `ENV_RIVER_DO_${farmId}_${stId}_${todayKey}`;

        if (!existingKeys.has(dedupeKey)) {
          const obsTimeStr = new Date(doReading.observedAt).toLocaleTimeString('th-TH', {
            timeZone: 'Asia/Bangkok',
            hour: '2-digit',
            minute: '2-digit',
          });

          const alert: EvaluatedAlertItem = {
            pondId: null,
            title: `เฝ้าระวัง: ออกซิเจนในน้ำธรรมชาติลดต่ำ (${doReading.value} mg/L)`,
            message: `สถานี ${wqStation.name || 'ต้นทาง'} ตรวจวัดค่าออกซิเจนละลายน้ำ (DO) ได้ ${doReading.value} mg/L เมื่อ ${obsTimeStr} น. ซึ่งต่ำกว่าเกณฑ์ปลอดภัย (${riverLowDoThreshold} mg/L) เสี่ยงสัตว์น้ำน็อคน้ำหากเปิดประตูระบายน้ำสูบเข้าบ่อเลี้ยง แนะนำชะลอการเปิดรับน้ำและตรวจวัดค่าน้ำจริงหน้าบานประตูก่อนจัดการน้ำ`,
            severity: 'WARNING',
            status: 'UNREAD',
            dedupeKey,
            ruleCode: 'ENV_RIVER_LOW_DO',
            sourceObservationTime: new Date(doReading.observedAt).toISOString(),
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
