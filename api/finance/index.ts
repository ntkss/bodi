import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_lib/prisma';
import { FinanceTransactionInputSchema } from '../_lib/validators';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;

  if (method === 'GET') {
    try {
      const { farmId, pondId, type, month } = req.query;

      // Build filter
      const whereClause: Record<string, unknown> = {};
      if (farmId) whereClause.farmId = String(farmId);
      if (pondId) whereClause.pondId = String(pondId);
      if (type) whereClause.type = String(type);

      if (month && typeof month === 'string') {
        // e.g. "2026-10"
        const [yearStr, monthStr] = month.split('-');
        const year = parseInt(yearStr, 10);
        const m = parseInt(monthStr, 10);
        if (!isNaN(year) && !isNaN(m)) {
          const startDate = new Date(year, m - 1, 1);
          const endDate = new Date(year, m, 1);
          whereClause.occurredAt = {
            gte: startDate,
            lt: endDate,
          };
        }
      }

      const transactions = await prisma.financeTransaction.findMany({
        where: whereClause,
        include: {
          pond: {
            select: { name: true },
          },
        },
        orderBy: { occurredAt: 'desc' },
      });

      const formatted = transactions.map((tx) => ({
        ...tx,
        amount: Number(tx.amount),
        pondName: tx.pond?.name || null,
      }));

      return res.status(200).json(formatted);
    } catch (err) {
      console.error('Error fetching finance transactions:', err);
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลการเงินได้' });
    }
  }

  if (method === 'POST') {
    try {
      const parseResult = FinanceTransactionInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'ข้อมูลรายการไม่ถูกต้อง',
          details: parseResult.error.flatten().fieldErrors,
        });
      }

      const data = parseResult.data;
      const newTx = await prisma.financeTransaction.create({
        data: {
          farmId: data.farmId,
          pondId: data.pondId || null,
          type: data.type,
          category: data.category,
          amount: data.amount,
          occurredAt: data.occurredAt || new Date(),
          note: data.note || null,
        },
      });

      return res.status(201).json({
        ...newTx,
        amount: Number(newTx.amount),
      });
    } catch (err) {
      console.error('Error creating finance transaction:', err);
      return res.status(500).json({ error: 'ไม่สามารถบันทึกรายการการเงินได้' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
