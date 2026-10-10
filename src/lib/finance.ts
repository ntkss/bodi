export interface TransactionItem {
  id?: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number | string;
  occurredAt?: string | Date;
  pondId?: string | null;
  pondName?: string | null;
  note?: string | null;
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

export const DEFAULT_INCOME_CATEGORIES = [
  'ขายกุ้งแชบ๊วยธรรมชาติ',
  'ขายกุ้งกุลาดำธรรมชาติ',
  'ขายปูดำคัดไซส์',
  'ขายปูดำคละไซส์',
  'ขายหอยแครง/สัตว์น้ำอื่น',
  'รายรับอื่นๆ',
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  'ค่าน้ำมันเครื่องสูบน้ำ',
  'ค่าไฟฟ้าวิดน้ำ',
  'ค่าพันธุ์ลูกกุ้ง/ลูกปู',
  'ค่าอาหารปลาเป็ด/อาหารเสริม',
  'ค่าปูนขาว/ปรับสภาพดินเลน',
  'ค่าแรงงานซ่อมคันบ่อ/ลอกเลน',
  'ค่าอุปกรณ์และตาข่ายดักสัตว์น้ำ',
  'รายจ่ายอื่นๆ',
];

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

/**
 * Filter transactions by specific YYYY-MM (e.g. "2026-10")
 */
export function filterTransactionsByMonth<T extends TransactionItem>(
  transactions: T[],
  yearMonth: string
): T[] {
  if (!yearMonth || yearMonth === 'ALL') return transactions;
  return transactions.filter((tx) => {
    if (!tx.occurredAt) return false;
    const date = new Date(tx.occurredAt);
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const ym = `${date.getFullYear()}-${m}`;
    return ym === yearMonth;
  });
}

/**
 * Generate CSV string with UTF-8 BOM for Thai language Excel support
 */
export function generateTransactionsCSV(transactions: TransactionItem[]): string {
  const bom = '\uFEFF';
  const headers = [
    'วันที่เกิดรายการ',
    'ประเภท',
    'หมวดหมู่',
    'จำนวนเงิน (บาท)',
    'บ่อ',
    'หมายเหตุ',
  ];

  const rows = transactions.map((tx) => {
    const dateStr = tx.occurredAt
      ? new Date(tx.occurredAt).toLocaleString('th-TH', {
          timeZone: 'Asia/Bangkok',
        })
      : '';
    const typeStr = tx.type === 'INCOME' ? 'รายรับ' : 'รายจ่าย';
    const amountStr = (
      typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount
    ).toFixed(2);
    const pondStr = tx.pondName ? `"${tx.pondName.replace(/"/g, '""')}"` : 'ไม่ระบุ';
    const noteStr = tx.note ? `"${tx.note.replace(/"/g, '""')}"` : '';

    return [
      `"${dateStr}"`,
      typeStr,
      `"${tx.category.replace(/"/g, '""')}"`,
      amountStr,
      pondStr,
      noteStr,
    ].join(',');
  });

  return bom + [headers.join(','), ...rows].join('\r\n');
}
