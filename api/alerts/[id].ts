import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_lib/prisma.js';
import { AlertStatusUpdateSchema } from '../_lib/validators.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const alertId = String(id);

  if (!alertId) {
    return res.status(400).json({ error: 'ไม่พบรหัสการแจ้งเตือน (Alert ID)' });
  }

  // PUT / PATCH: Update alert status
  if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const parseResult = AlertStatusUpdateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'ข้อมูลสถานะไม่ถูกต้อง',
          details: parseResult.error.flatten().fieldErrors,
        });
      }

      const { status } = parseResult.data;
      const updated = await prisma.alert.update({
        where: { id: alertId },
        data: {
          status,
          resolvedAt: status === 'RESOLVED' ? new Date() : null,
        },
      });

      return res.status(200).json(updated);
    } catch (err) {
      console.error('Error updating alert status:', err);
      return res.status(500).json({ error: 'ไม่สามารถอัปเดตสถานะการแจ้งเตือนได้' });
    }
  }

  // DELETE: Remove alert
  if (req.method === 'DELETE') {
    try {
      await prisma.alert.delete({
        where: { id: alertId },
      });
      return res.status(200).json({ message: 'ลบการแจ้งเตือนเรียบร้อยแล้ว' });
    } catch (err) {
      console.error('Error deleting alert:', err);
      return res.status(500).json({ error: 'ไม่สามารถลบการแจ้งเตือนได้' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
