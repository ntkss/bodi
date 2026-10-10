import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_lib/prisma.js';
import {
  FinanceTransactionInputSchema,
  FinanceTransactionUpdateSchema,
} from '../_lib/validators.js';
import { getAuthContext } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;
  const auth = await getAuthContext(req);
  const txId = req.query.id ? String(req.query.id) : null;

  // Single transaction operations (with :id)
  if (txId) {
    if (method === 'PUT' || method === 'PATCH') {
      try {
        const parseResult = FinanceTransactionUpdateSchema.safeParse(req.body);
        if (!parseResult.success) {
          return res.status(400).json({
            error: 'ข้อมูลไม่ถูกต้อง',
            details: parseResult.error.flatten().fieldErrors,
          });
        }

        const data = parseResult.data;
        const updated = await prisma.financeTransaction.update({
          where: { id: txId },
          data: {
            ...(data.pondId !== undefined && { pondId: data.pondId || null }),
            ...(data.type !== undefined && { type: data.type }),
            ...(data.category !== undefined && { category: data.category }),
            ...(data.amount !== undefined && { amount: data.amount }),
            ...(data.occurredAt !== undefined && { occurredAt: data.occurredAt }),
            ...(data.note !== undefined && { note: data.note || null }),
          },
        });

        return res.status(200).json({
          ...updated,
          amount: Number(updated.amount),
        });
      } catch (err) {
        console.error('Error updating finance transaction:', err);
        return res.status(500).json({ error: 'ไม่สามารถแก้ไขรายการการเงินได้' });
      }
    }

    if (method === 'DELETE') {
      try {
        await prisma.financeTransaction.delete({
          where: { id: txId },
        });
        return res.status(200).json({ message: 'ลบรายการการเงินเรียบร้อยแล้ว' });
      } catch (err) {
        console.error('Error deleting finance transaction:', err);
        return res.status(500).json({ error: 'ไม่สามารถลบรายการการเงินได้' });
      }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Collection operations (/api/finance)
  if (method === 'GET') {
    try {
      const { farmId, pondId, type, month } = req.query;

      const targetFarmId = (farmId as string) || auth?.farm.id;
      const whereClause: Record<string, unknown> = {};
      if (targetFarmId) whereClause.farmId = targetFarmId;
      if (pondId) whereClause.pondId = String(pondId);
      if (type) whereClause.type = String(type);

      if (month && typeof month === 'string') {
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
          error: 'ข้อมูลการเงินไม่ถูกต้อง',
          details: parseResult.error.flatten().fieldErrors,
        });
      }

      const data = parseResult.data;
      const farmId = data.farmId || auth?.farm.id;
      if (!farmId) {
        return res.status(400).json({ error: 'ไม่พบข้อมูล Farm ID' });
      }

      const newTx = await prisma.financeTransaction.create({
        data: {
          farmId,
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
