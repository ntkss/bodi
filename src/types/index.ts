export type PondStatus = 'ACTIVE' | 'RESTING' | 'HARVESTED';

export type LogType =
  'WATER_QUALITY' | 'WATER_EXCHANGE' | 'ANIMAL_OBSERVATION' | 'HARVEST' | 'GENERAL_NOTE';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'UNREAD' | 'REVIEWED' | 'RESOLVED';

export interface Farm {
  id: string;
  name: string;
  timezone: string;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  waterSourceCanal?: string | null;
  tidalInfluence?: string | null;
  waterPathNotes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type VerificationStatus = 'VERIFIED' | 'CANDIDATE' | 'UNAVAILABLE' | 'BLOCKED';
export type FreshnessStatus = 'FRESH' | 'STALE' | 'NO_DATA';

export interface ReferenceStation {
  id: string;
  farmId?: string | null;
  provider: 'OPEN_METEO' | 'NAVY_HYDRO' | 'THAI_WATER' | 'PCD_IWIS' | 'MANUAL' | string;
  providerStationId?: string | null;
  name: string;
  sourceUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  parameters?: string | null;
  units?: string | null;
  relevanceNotes?: string | null;
  verificationStatus: VerificationStatus;
  lastCheckedAt?: string | null;
  readings?: EnvironmentalReading[];
  latestReading?: EnvironmentalReading | null;
  freshness?: FreshnessStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface EnvironmentalReading {
  id: string;
  stationId: string;
  parameter: string;
  value: number;
  unit: string;
  observedAt: string;
  fetchedAt: string;
  status: 'VALID' | 'STALE' | 'UNVERIFIED' | 'SUSPECT' | string;
  sourceRecordId?: string | null;
  createdAt?: string;
}

export interface Pond {
  id: string;
  farmId: string;
  name: string;
  area?: number;
  waterSource?: string;
  species?: string;
  farmingMethod?: string;
  status: PondStatus;
  notes?: string;
  latestLog?: PondLog;
  createdAt?: string;
  updatedAt?: string;
}

export interface PondLog {
  id: string;
  pondId: string;
  type: LogType;
  recordedAt: string;
  temperature?: number | null;
  ph?: number | null;
  salinity?: number | null;
  dissolvedOxygen?: number | null;
  exchangeType?: 'IN' | 'OUT' | 'CIRCULATE' | null;
  exchangeVolume?: string | null;
  observation?: string | null;
  mortalityCount?: number | null;
  harvestQuantity?: number | null;
  harvestUnit?: string | null;
  harvestPrice?: number | null;
  notes?: string | null;
  photoRef?: string | null;
}

export interface FinanceTransaction {
  id: string;
  farmId: string;
  pondId?: string | null;
  pondName?: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  occurredAt: string;
  note?: string | null;
}

export interface Alert {
  id: string;
  pondId?: string | null;
  pondName?: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  createdAt: string;
}
