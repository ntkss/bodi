import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_lib/prisma.js';
import { PondLogInputSchema } from '../_lib/validators.js';
import { getAuthContext } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;
  const auth = await getAuthContext(req);

  if (method === 'GET') {
    try {
      const { pondId, limit } = req.query;
      const whereClause: Record<string, unknown> = {};
      if (pondId) {
        whereClause.pondId = String(pondId);
      } else if (auth?.farm.id) {
        whereClause.pond = { farmId: auth.farm.id };
      }
      const takeCount = limit ? parseInt(String(limit), 10) : 100;

      const logs = await prisma.pondLog.findMany({
        where: whereClause,
        orderBy: { recordedAt: 'desc' },
        take: takeCount,
      });

      return res.status(200).json(logs);
    } catch (err) {
      console.error('Error fetching pond logs:', err);
      return res.status(500).json({ error: 'ไม่สามารถดึงบันทึกบ่อได้' });
    }
  }

  if (method === 'POST') {
    try {
      const parseResult = PondLogInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'ข้อมูลบันทึกไม่ถูกต้อง',
          details: parseResult.error.flatten().fieldErrors,
        });
      }

      const data = parseResult.data;
      const newLog = await prisma.pondLog.create({
        data: {
          pondId: data.pondId,
          type: data.type,
          recordedAt: data.recordedAt || new Date(),
          temperature: data.temperature,
          ph: data.ph,
          salinity: data.salinity,
          dissolvedOxygen: data.dissolvedOxygen,
          exchangeType: data.exchangeType,
          exchangeVolume: data.exchangeVolume,
          observation: data.observation,
          mortalityCount: data.mortalityCount,
          harvestQuantity: data.harvestQuantity,
          harvestUnit: data.harvestUnit,
          harvestPrice: data.harvestPrice,
          notes: data.notes,
          photoRef: data.photoRef,
        },
      });

      return res.status(201).json(newLog);
    } catch (err) {
      console.error('Error creating pond log:', err);
      return res.status(500).json({ error: 'ไม่สามารถบันทึกข้อมูลได้' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
