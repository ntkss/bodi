import { describe, it, expect } from 'vitest';
import {
  PondInputSchema,
  PondUpdateSchema,
  PondLogInputSchema,
  PondLogUpdateSchema,
} from '../api/_lib/validators';

describe('Milestone 2: Ponds and Daily Logs Logic & Validation', () => {
  describe('Pond CRUD Validation', () => {
    it('creates a natural shrimp pond without mandatory feed or stocking count', () => {
      const naturalPond = {
        farmId: 'farm-1',
        name: 'บ่อ 1 กุ้งแชบ๊วยธรรมชาติ',
        area: 12.5,
        waterSource: 'น้ำคลองธรรมชาติ ปากอ่าวคลองด่าน',
        species: 'กุ้งแชบ๊วย, กุ้งกุลาดำ',
        farmingMethod: 'ธรรมชาติ (ไม่ใช้อาหารเม็ด รับลูกกุ้งตามน้ำหลาก)',
        status: 'ACTIVE' as const,
        notes: 'เปิดประตูน้ำรับลูกกุ้งตามรอบน้ำเกิด',
      };

      const result = PondInputSchema.safeParse(naturalPond);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('บ่อ 1 กุ้งแชบ๊วยธรรมชาติ');
        expect(result.data.area).toBe(12.5);
      }
    });

    it('allows minimal pond creation with only farmId and name', () => {
      const minimalPond = {
        farmId: 'farm-1',
        name: 'บ่อพักน้ำ 3',
      };

      const result = PondInputSchema.safeParse(minimalPond);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('ACTIVE');
        expect(result.data.species).toBeUndefined();
      }
    });

    it('validates partial pond update for changing status and details', () => {
      const updateData = {
        status: 'RESTING' as const,
        notes: 'ปิดบ่อตากเลน 15 วัน',
      };

      const result = PondUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('RESTING');
      }
    });
  });

  describe('Daily Log Types Validation', () => {
    it('1. Water Quality Log: all measurements optional, values checked when present', () => {
      const validWaterLog = {
        pondId: 'pond-1',
        type: 'WATER_QUALITY' as const,
        dissolvedOxygen: 4.8,
        ph: 7.9,
        salinity: 18.0,
        temperature: 29.5,
        notes: 'น้ำสีเขียวมะกอกใส',
      };

      const result = PondLogInputSchema.safeParse(validWaterLog);
      expect(result.success).toBe(true);

      // Absent values are permitted (natural ponds where equipment is absent)
      const emptyMeasurementsLog = {
        pondId: 'pond-1',
        type: 'WATER_QUALITY' as const,
        notes: 'น้ำขุ่นเล็กน้อยเนื่องจากฝนตก ไม่ได้วัดค่า',
      };
      const emptyResult = PondLogInputSchema.safeParse(emptyMeasurementsLog);
      expect(emptyResult.success).toBe(true);
    });

    it('2. Water Exchange Log: accepts in/out/circulate and volume', () => {
      const exchangeLog = {
        pondId: 'pond-1',
        type: 'WATER_EXCHANGE' as const,
        exchangeType: 'IN' as const,
        exchangeVolume: '30 ซม.',
        notes: 'เปิดท่อรับน้ำตามน้ำขึ้นช่วงเช้า',
      };

      const result = PondLogInputSchema.safeParse(exchangeLog);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.exchangeType).toBe('IN');
      }
    });

    it('3. Animal Observation Log: accepts behavior and mortality count', () => {
      const observationLog = {
        pondId: 'pond-2',
        type: 'ANIMAL_OBSERVATION' as const,
        observation: 'ปูดำกินเหยื่อปกติ พบตามซอกไม้',
        mortalityCount: 0,
      };

      const result = PondLogInputSchema.safeParse(observationLog);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mortalityCount).toBe(0);
      }
    });

    it('4. Harvest Log: records harvest quantity, unit and price', () => {
      const harvestLog = {
        pondId: 'pond-1',
        type: 'HARVEST' as const,
        harvestQuantity: 120,
        harvestUnit: 'กก.',
        harvestPrice: 28000,
        notes: 'จับกุ้งแชบ๊วยคัดไซส์ 40 ตัว/กก.',
      };

      const result = PondLogInputSchema.safeParse(harvestLog);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.harvestQuantity).toBe(120);
        expect(result.data.harvestUnit).toBe('กก.');
      }
    });

    it('5. General Note Log: records simple farm observation', () => {
      const generalLog = {
        pondId: 'pond-3',
        type: 'GENERAL_NOTE' as const,
        notes: 'โรยปูนขาวรอบคันบ่อเสร็จเรียบร้อย',
      };

      const result = PondLogInputSchema.safeParse(generalLog);
      expect(result.success).toBe(true);
    });

    it('Correcting mistakes: validates partial log update', () => {
      // Farmer correcting a mistyped DO reading from 1.5 to 5.1
      const correctedLog = {
        dissolvedOxygen: 5.1,
        notes: 'แก้ไขค่า DO ที่พิมพ์ผิด',
      };

      const result = PondLogUpdateSchema.safeParse(correctedLog);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dissolvedOxygen).toBe(5.1);
      }
    });
  });
});
