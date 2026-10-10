import { z } from 'zod';

// Farm validation schema
export const FarmInputSchema = z.object({
  name: z.string().trim().min(1, 'กรุณาระบุชื่อฟาร์ม'),
  timezone: z.string().default('Asia/Bangkok'),
});

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

export type FarmInput = z.infer<typeof FarmInputSchema>;
export type PondInput = z.infer<typeof PondInputSchema>;
export type PondLogInput = z.infer<typeof PondLogInputSchema>;
export type FinanceTransactionInput = z.infer<typeof FinanceTransactionInputSchema>;
export type AlertStatusUpdate = z.infer<typeof AlertStatusUpdateSchema>;
