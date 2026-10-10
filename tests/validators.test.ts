import { describe, it, expect } from 'vitest';
import {
  PondLogInputSchema,
  FinanceTransactionInputSchema,
  PondInputSchema,
  FarmInputSchema,
  ReferenceStationInputSchema,
  EnvironmentalReadingInputSchema,
} from '../api/_lib/validators';

describe('Zod Validation Schemas', () => {
  describe('PondInputSchema', () => {
    it('accepts valid pond input with optional fields', () => {
      const data = {
        farmId: 'farm-123',
        name: 'บ่อ 1 กุ้งธรรมชาติ',
        waterSource: 'น้ำคลองธรรมชาติ',
        farmingMethod: 'ธรรมชาติ',
      };
      const result = PondInputSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects pond with empty name', () => {
      const data = {
        farmId: 'farm-123',
        name: '   ',
      };
      const result = PondInputSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('PondLogInputSchema (Natural / Semi-natural compatibility)', () => {
    it('allows logs where water quality measurements are absent', () => {
      // In natural farming, water readings might not be measured every day
      const data = {
        pondId: 'pond-123',
        type: 'ANIMAL_OBSERVATION',
        observation: 'กุ้งว่ายดี ไม่ลอยหัว',
        mortalityCount: 0,
      };
      const result = PondLogInputSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('validates water quality ranges when present', () => {
      const validData = {
        pondId: 'pond-123',
        type: 'WATER_QUALITY',
        temperature: 29.5,
        ph: 7.8,
        dissolvedOxygen: 4.5,
      };
      const validResult = PondLogInputSchema.safeParse(validData);
      expect(validResult.success).toBe(true);

      const invalidData = {
        pondId: 'pond-123',
        type: 'WATER_QUALITY',
        ph: 16.0, // Invalid pH (> 14)
      };
      const invalidResult = PondLogInputSchema.safeParse(invalidData);
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('FinanceTransactionInputSchema', () => {
    it('accepts valid income transaction', () => {
      const data = {
        farmId: 'farm-123',
        type: 'INCOME',
        category: 'ขายกุ้ง',
        amount: '45000',
      };
      const result = FinanceTransactionInputSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(45000);
      }
    });

    it('rejects transaction with zero or negative amount', () => {
      const data = {
        farmId: 'farm-123',
        type: 'EXPENSE',
        category: 'ค่าน้ำมัน',
        amount: -500,
      };
      const result = FinanceTransactionInputSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('FarmInputSchema & FarmUpdateSchema (Location & Water Source)', () => {
    it('accepts farm location and water path configuration', () => {
      const data = {
        name: 'บ่อดี ฟาร์มสมุทรสงคราม',
        province: 'สมุทรสงคราม',
        district: 'เมืองสมุทรสงคราม',
        subdistrict: 'ลาดใหญ่',
        latitude: 13.4098,
        longitude: 99.9965,
        waterSourceCanal: 'คลองแม่กลอง',
        tidalInfluence: 'DIRECT',
        waterPathNotes: 'เปิดรับน้ำตามรอบน้ำขึ้น-น้ำลง',
      };
      const result = FarmInputSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects invalid latitude or longitude out of bounds', () => {
      const invalidLat = {
        name: 'บ่อดี ฟาร์ม',
        latitude: 95.0, // Invalid lat (> 90)
      };
      expect(FarmInputSchema.safeParse(invalidLat).success).toBe(false);

      const invalidLng = {
        name: 'บ่อดี ฟาร์ม',
        longitude: 195.0, // Invalid lng (> 180)
      };
      expect(FarmInputSchema.safeParse(invalidLng).success).toBe(false);
    });
  });

  describe('ReferenceStationInputSchema', () => {
    it('accepts valid reference station configuration with known provider', () => {
      const data = {
        name: 'สถานีตรวจวัดสภาพอากาศ สมุทรสงคราม',
        provider: 'OPEN_METEO',
        providerStationId: 'open-meteo-samut-songkhram',
        verificationStatus: 'VERIFIED',
        parameters: 'precipitation,temperature',
        units: 'mm, °C',
      };
      const result = ReferenceStationInputSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects station with unsupported provider', () => {
      const data = {
        name: 'สถานีปริศนา',
        provider: 'UNKNOWN_PROVIDER',
      };
      const result = ReferenceStationInputSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('EnvironmentalReadingInputSchema', () => {
    it('accepts valid environmental reading and transforms ISO date string', () => {
      const data = {
        stationId: 'st-123',
        parameter: 'precipitation',
        value: 12.5,
        unit: 'mm',
        observedAt: '2026-10-10T14:00:00Z',
        status: 'VALID',
      };
      const result = EnvironmentalReadingInputSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.observedAt).toBeInstanceOf(Date);
        expect(result.data.fetchedAt).toBeInstanceOf(Date);
      }
    });
  });
});
