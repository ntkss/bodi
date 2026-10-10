import { describe, it, expect } from 'vitest';
import { calculateFinanceSummary, formatBaht } from '../src/lib/finance';

describe('Finance Summary Logic', () => {
  it('calculates total income, expense, and net profit correctly', () => {
    const transactions = [
      { type: 'INCOME' as const, category: 'ขายกุ้ง', amount: 42500.5 },
      { type: 'INCOME' as const, category: 'ขายปู', amount: 18200.25 },
      { type: 'EXPENSE' as const, category: 'ค่าน้ำมัน', amount: 3500.0 },
      { type: 'EXPENSE' as const, category: 'ค่าอาหาร', amount: 1400.75 },
    ];

    const summary = calculateFinanceSummary(transactions);

    expect(summary.totalIncome).toBe(60700.75);
    expect(summary.totalExpense).toBe(4900.75);
    expect(summary.netProfit).toBe(55800.0);
  });

  it('handles empty transactions without NaN or errors', () => {
    const summary = calculateFinanceSummary([]);

    expect(summary.totalIncome).toBe(0);
    expect(summary.totalExpense).toBe(0);
    expect(summary.netProfit).toBe(0);
  });

  it('aggregates amounts by category correctly', () => {
    const transactions = [
      { type: 'EXPENSE' as const, category: 'ค่าน้ำมัน', amount: 1000 },
      { type: 'EXPENSE' as const, category: 'ค่าน้ำมัน', amount: 2500 },
      { type: 'EXPENSE' as const, category: 'ค่าแรง', amount: 500 },
    ];

    const summary = calculateFinanceSummary(transactions);

    expect(summary.expenseByCategory['ค่าน้ำมัน']).toBe(3500);
    expect(summary.expenseByCategory['ค่าแรง']).toBe(500);
  });

  it('formats currency correctly in Thai format', () => {
    expect(formatBaht(1500)).toBe('1,500.00 บาท');
  });
});
