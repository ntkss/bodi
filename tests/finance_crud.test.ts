import { describe, it, expect } from 'vitest';
import {
  calculateFinanceSummary,
  filterTransactionsByMonth,
  generateTransactionsCSV,
} from '../src/lib/finance';
import {
  FinanceTransactionInputSchema,
  FinanceTransactionUpdateSchema,
} from '../api/_lib/validators';

describe('Milestone 3: Finance CRUD & Aggregations', () => {
  const sampleTransactions = [
    {
      id: 'tx-1',
      farmId: 'farm-1',
      type: 'INCOME' as const,
      category: 'ขายกุ้งแชบ๊วยธรรมชาติ',
      amount: 42500.5,
      occurredAt: '2026-10-10T08:00:00.000Z',
      pondName: 'บ่อ 1',
      note: 'ส่งแพเจ๊นา',
    },
    {
      id: 'tx-2',
      farmId: 'farm-1',
      type: 'INCOME' as const,
      category: 'ขายปูดำคัดไซส์',
      amount: 18200.25,
      occurredAt: '2026-10-09T08:00:00.000Z',
      pondName: 'บ่อ 2',
    },
    {
      id: 'tx-3',
      farmId: 'farm-1',
      type: 'EXPENSE' as const,
      category: 'ค่าน้ำมันเครื่องสูบน้ำ',
      amount: 3500.0,
      occurredAt: '2026-10-08T08:00:00.000Z',
      note: 'ดีเซล 100 ลิตร',
    },
    {
      id: 'tx-4',
      farmId: 'farm-1',
      type: 'EXPENSE' as const,
      category: 'ค่าปูนขาวปรับสภาพดินเลน',
      amount: 1200.75,
      occurredAt: '2026-09-25T08:00:00.000Z', // September (different month)
    },
  ];

  it('aggregates totals safely without float precision drift', () => {
    const summary = calculateFinanceSummary(sampleTransactions);
    expect(summary.totalIncome).toBe(60700.75);
    expect(summary.totalExpense).toBe(4700.75);
    expect(summary.netProfit).toBe(56000.0);
  });

  it('filters transactions accurately by month YYYY-MM', () => {
    const octTransactions = filterTransactionsByMonth(sampleTransactions, '2026-10');
    expect(octTransactions.length).toBe(3);

    const sepTransactions = filterTransactionsByMonth(sampleTransactions, '2026-09');
    expect(sepTransactions.length).toBe(1);
    expect(sepTransactions[0].category).toBe('ค่าปูนขาวปรับสภาพดินเลน');

    const allTransactions = filterTransactionsByMonth(sampleTransactions, 'ALL');
    expect(allTransactions.length).toBe(4);
  });

  it('generates valid CSV with UTF-8 BOM and headers for Excel', () => {
    const csv = generateTransactionsCSV(sampleTransactions);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain(
      'วันที่เกิดรายการ,ประเภท,หมวดหมู่,จำนวนเงิน (บาท),บ่อ,หมายเหตุ'
    );
    expect(csv).toContain('ขายกุ้งแชบ๊วยธรรมชาติ');
    expect(csv).toContain('42500.50');
  });

  it('validates transaction creation schema with Zod', () => {
    const valid = {
      farmId: 'farm-1',
      type: 'INCOME',
      category: 'ขายกุ้ง',
      amount: 15000,
    };
    expect(FinanceTransactionInputSchema.safeParse(valid).success).toBe(true);

    const invalid = {
      farmId: 'farm-1',
      type: 'INCOME',
      category: 'ขายกุ้ง',
      amount: -100, // Negative amount disallowed
    };
    expect(FinanceTransactionInputSchema.safeParse(invalid).success).toBe(false);
  });

  it('validates partial transaction updates to correct mistakes', () => {
    const correction = {
      amount: 45000,
      note: 'แก้ไขยอดเงินที่ลงผิด',
    };
    const result = FinanceTransactionUpdateSchema.safeParse(correction);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(45000);
    }
  });
});
