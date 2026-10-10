import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_lib/prisma.js';
import { FinanceTransactionUpdateSchema } from '../_lib/validators.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const txId = String(id);

  if (!txId) {
    return res.status(400).json({ error: 'ไม่พบรหัสรายการ (Transaction ID)' });
  }

  // PUT / PATCH: Update finance transaction
  if (req.method === 'PUT' || req.method === 'PATCH') {
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

  // DELETE: Remove transaction
  if (req.method === 'DELETE') {
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
