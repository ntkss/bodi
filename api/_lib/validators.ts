import { z } from 'zod';

// Farm validation schema
export const FarmInputSchema = z.object({
  name: z.string().trim().min(1, 'กรุณาระบุชื่อฟาร์ม'),
  timezone: z.string().default('Asia/Bangkok'),
  province: z.string().trim().optional().nullable(),
  district: z.string().trim().optional().nullable(),
  subdistrict: z.string().trim().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  waterSourceCanal: z.string().trim().optional().nullable(),
  tidalInfluence: z.enum(['DIRECT', 'INDIRECT', 'NONE', 'UNKNOWN']).optional().nullable(),
  waterPathNotes: z.string().trim().optional().nullable(),
});
export const FarmUpdateSchema = FarmInputSchema.partial();

// Pond validation schema
export const PondInputSchema = z.object({
  farmId: z.string().min(1, 'กรุณาระบุรหัสฟาร์ม'),
  name: z.string().trim().min(1, 'กรุณาระบุชื่อบ่อ'),
  area: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val === undefined || val === '' ? undefined : Number(val))),
  waterSource: z.string().trim().optional(),
  species: z.string().trim().optional(),
  farmingMethod: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'RESTING', 'HARVESTED']).default('ACTIVE'),
  notes: z.string().trim().optional(),
});

// Pond Log validation schema (supports natural/semi-natural ponds without forcing mandatory values)
export const PondLogInputSchema = z.object({
  pondId: z.string().min(1, 'กรุณาระบุรหัสบ่อ'),
  type: z.enum([
    'WATER_QUALITY',
    'WATER_EXCHANGE',
    'ANIMAL_OBSERVATION',
    'HARVEST',
    'GENERAL_NOTE',
  ]),
  recordedAt: z
    .union([z.string(), z.date()])
    .optional()
    .transform((val) => (val ? new Date(val) : new Date())),
  // Water quality parameters (all optional)
  temperature: z.number().min(0).max(60).optional().nullable(),
  ph: z.number().min(0).max(14).optional().nullable(),
  salinity: z.number().min(0).max(100).optional().nullable(),
  dissolvedOxygen: z.number().min(0).max(30).optional().nullable(),
  // Water exchange parameters
  exchangeType: z.enum(['IN', 'OUT', 'CIRCULATE']).optional().nullable(),
  exchangeVolume: z.string().trim().optional().nullable(),
  // Animal observation
  observation: z.string().trim().optional().nullable(),
  mortalityCount: z.number().int().min(0).optional().nullable(),
  // Harvest
  harvestQuantity: z.number().min(0).optional().nullable(),
  harvestUnit: z.string().trim().optional().nullable(),
  harvestPrice: z.number().min(0).optional().nullable(),
  // Notes & photo reference
  notes: z.string().trim().optional().nullable(),
  photoRef: z.string().trim().optional().nullable(),
});

// Finance transaction validation schema (with decimal-safe amount validation)
export const FinanceTransactionInputSchema = z.object({
  farmId: z.string().min(1, 'กรุณาระบุรหัสฟาร์ม'),
  pondId: z.string().trim().optional().nullable(),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().trim().min(1, 'กรุณาระบุหมวดหมู่การเงิน'),
  amount: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'จำนวนเงินต้องเป็นตัวเลขที่มากกว่า 0',
    }),
  occurredAt: z
    .union([z.string(), z.date()])
    .optional()
    .transform((val) => (val ? new Date(val) : new Date())),
  note: z.string().trim().optional().nullable(),
});

// Alert status update schema
export const AlertStatusUpdateSchema = z.object({
  status: z.enum(['UNREAD', 'REVIEWED', 'RESOLVED']),
});

// ReferenceStation validation schema
export const ReferenceStationInputSchema = z.object({
  farmId: z.string().trim().optional().nullable(),
  provider: z.enum(['OPEN_METEO', 'NAVY_HYDRO', 'THAI_WATER', 'PCD_IWIS', 'MANUAL']),
  providerStationId: z.string().trim().optional().nullable(),
  name: z.string().trim().min(1, 'กรุณาระบุชื่อสถานี'),
  sourceUrl: z.string().trim().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  parameters: z.string().trim().optional().nullable(),
  units: z.string().trim().optional().nullable(),
  relevanceNotes: z.string().trim().optional().nullable(),
  verificationStatus: z
    .enum(['VERIFIED', 'CANDIDATE', 'UNAVAILABLE', 'BLOCKED'])
    .default('CANDIDATE'),
});

export const ReferenceStationUpdateSchema = ReferenceStationInputSchema.partial();

// EnvironmentalReading validation schema
export const EnvironmentalReadingInputSchema = z.object({
  stationId: z.string().min(1, 'กรุณาระบุรหัสสถานีอ้างอิง'),
  parameter: z.string().trim().min(1, 'กรุณาระบุตัวแปรการตรวจวัด'),
  value: z.number(),
  unit: z.string().trim().min(1, 'กรุณาระบุหน่วยวัด'),
  observedAt: z
    .union([z.string(), z.date()])
    .transform((val) => (val instanceof Date ? val : new Date(val))),
  fetchedAt: z
    .union([z.string(), z.date()])
    .optional()
    .transform((val) => (val ? new Date(val) : new Date())),
  status: z.enum(['VALID', 'STALE', 'UNVERIFIED', 'SUSPECT']).default('VALID'),
  sourceRecordId: z.string().trim().optional().nullable(),
});

// Update schemas for correcting mistakes
export const PondUpdateSchema = PondInputSchema.partial().omit({ farmId: true });
export const PondLogUpdateSchema = PondLogInputSchema.partial().omit({ pondId: true });
export const FinanceTransactionUpdateSchema =
  FinanceTransactionInputSchema.partial().omit({ farmId: true });

export type FarmInput = z.infer<typeof FarmInputSchema>;
export type FarmUpdate = z.infer<typeof FarmUpdateSchema>;
export type PondInput = z.infer<typeof PondInputSchema>;
export type PondUpdate = z.infer<typeof PondUpdateSchema>;
export type PondLogInput = z.infer<typeof PondLogInputSchema>;
export type PondLogUpdate = z.infer<typeof PondLogUpdateSchema>;
export type FinanceTransactionInput = z.infer<typeof FinanceTransactionInputSchema>;
export type FinanceTransactionUpdate = z.infer<typeof FinanceTransactionUpdateSchema>;
export type AlertStatusUpdate = z.infer<typeof AlertStatusUpdateSchema>;
export type ReferenceStationInput = z.infer<typeof ReferenceStationInputSchema>;
export type ReferenceStationUpdate = z.infer<typeof ReferenceStationUpdateSchema>;
export type EnvironmentalReadingInput = z.infer<typeof EnvironmentalReadingInputSchema>;
