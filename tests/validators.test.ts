import { describe, it, expect } from 'vitest';
import {
  PondLogInputSchema,
  FinanceTransactionInputSchema,
  PondInputSchema,
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
});
