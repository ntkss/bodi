export interface TransactionItem {
  id?: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number | string;
  occurredAt?: string | Date;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  formattedTotalIncome: string;
  formattedTotalExpense: string;
  formattedNetProfit: string;
  incomeByCategory: Record<string, number>;
  expenseByCategory: Record<string, number>;
}

/**
 * Decimal-safe calculation of income, expenses, and net profit.
 * Rounds safely to 2 decimal places to avoid floating point inaccuracies.
 */
export function calculateFinanceSummary(transactions: TransactionItem[]): FinanceSummary {
  let totalIncomeCents = 0;
  let totalExpenseCents = 0;

  const incomeByCategory: Record<string, number> = {};
  const expenseByCategory: Record<string, number> = {};

  for (const tx of transactions) {
    const rawAmount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;
    if (isNaN(rawAmount) || rawAmount <= 0) continue;

    // Convert to integer cents for accurate arithmetic
    const cents = Math.round(rawAmount * 100);

    if (tx.type === 'INCOME') {
      totalIncomeCents += cents;
      incomeByCategory[tx.category] = (incomeByCategory[tx.category] || 0) + rawAmount;
    } else if (tx.type === 'EXPENSE') {
      totalExpenseCents += cents;
      expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + rawAmount;
    }
  }

  const totalIncome = totalIncomeCents / 100;
  const totalExpense = totalExpenseCents / 100;
  const netProfit = (totalIncomeCents - totalExpenseCents) / 100;

  const formatter = new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return {
    totalIncome,
    totalExpense,
    netProfit,
    formattedTotalIncome: formatter.format(totalIncome),
    formattedTotalExpense: formatter.format(totalExpense),
    formattedNetProfit: formatter.format(netProfit),
    incomeByCategory,
    expenseByCategory,
  };
}

/**
 * Format currency in Thai Baht format
 */
export function formatBaht(amount: number): string {
  return (
    new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' บาท'
  );
}
