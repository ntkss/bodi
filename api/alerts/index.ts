import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_lib/prisma.js';
import { getAuthContext } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;
  const auth = await getAuthContext(req);

  if (method === 'GET') {
    try {
      const { status, pondId } = req.query;
      const whereClause: Record<string, unknown> = {};

      if (status) whereClause.status = String(status);
      if (pondId) {
        whereClause.pondId = String(pondId);
      } else if (auth?.farm.id) {
        whereClause.OR = [
          { pond: { farmId: auth.farm.id } },
          { pondId: null },
        ];
      }

      const alerts = await prisma.alert.findMany({
        where: whereClause,
        include: {
          pond: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = alerts.map((a) => ({
        ...a,
        pondName: a.pond?.name || null,
      }));

      return res.status(200).json(formatted);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลการแจ้งเตือนได้' });
    }
  }

  if (method === 'POST') {
    try {
      const { pondId, title, message, severity, dedupeKey } = req.body;

      if (!title || !message) {
        return res.status(400).json({ error: 'กรุณาระบุหัวข้อและข้อความแจ้งเตือน' });
      }

      // Check dedupeKey if supplied
      if (dedupeKey) {
        const existing = await prisma.alert.findFirst({
          where: { dedupeKey: String(dedupeKey) },
        });
        if (existing) {
          return res.status(200).json({
            message: 'การแจ้งเตือนนี้มีอยู่ในระบบแล้ว (Deduplicated)',
            alert: existing,
          });
        }
      }

      const newAlert = await prisma.alert.create({
        data: {
          pondId: pondId || null,
          title,
          message,
          severity: severity || 'WARNING',
          status: 'UNREAD',
          dedupeKey: dedupeKey || null,
        },
      });

      return res.status(201).json(newAlert);
    } catch (err) {
      console.error('Error creating alert:', err);
      return res.status(500).json({ error: 'ไม่สามารถสร้างการแจ้งเตือนได้' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
