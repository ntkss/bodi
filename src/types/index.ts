export type PondStatus = 'ACTIVE' | 'RESTING' | 'HARVESTED';

export type LogType =
  'WATER_QUALITY' | 'WATER_EXCHANGE' | 'ANIMAL_OBSERVATION' | 'HARVEST' | 'GENERAL_NOTE';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'UNREAD' | 'REVIEWED' | 'RESOLVED';

export interface Farm {
  id: string;
  name: string;
  timezone: string;
  createdAt: string;
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
