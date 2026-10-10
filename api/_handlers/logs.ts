import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_lib/prisma.js';
import { PondLogInputSchema, PondLogUpdateSchema } from '../_lib/validators.js';
import { getAuthContext } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;
  const auth = await getAuthContext(req);
  const logId = req.query.id ? String(req.query.id) : null;

  // Single log operations (with :id)
  if (logId) {
    if (method === 'GET') {
      try {
        const log = await prisma.pondLog.findUnique({
          where: { id: logId },
        });
        if (!log) {
          return res.status(404).json({ error: 'ไม่พบบันทึก' });
        }
        return res.status(200).json(log);
      } catch (err) {
        console.error('Error fetching log:', err);
        return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลบันทึกได้' });
      }
    }

    if (method === 'PUT' || method === 'PATCH') {
      try {
        const parseResult = PondLogUpdateSchema.safeParse(req.body);
        if (!parseResult.success) {
          return res.status(400).json({
            error: 'ข้อมูลไม่ถูกต้อง',
            details: parseResult.error.flatten().fieldErrors,
          });
        }

        const data = parseResult.data;
        const updatedLog = await prisma.pondLog.update({
          where: { id: logId },
          data: {
            ...(data.type !== undefined && { type: data.type }),
            ...(data.recordedAt !== undefined && { recordedAt: data.recordedAt }),
            ...(data.temperature !== undefined && { temperature: data.temperature }),
            ...(data.ph !== undefined && { ph: data.ph }),
            ...(data.salinity !== undefined && { salinity: data.salinity }),
            ...(data.dissolvedOxygen !== undefined && {
              dissolvedOxygen: data.dissolvedOxygen,
            }),
            ...(data.exchangeType !== undefined && { exchangeType: data.exchangeType }),
            ...(data.exchangeVolume !== undefined && {
              exchangeVolume: data.exchangeVolume,
            }),
            ...(data.observation !== undefined && { observation: data.observation }),
            ...(data.mortalityCount !== undefined && {
              mortalityCount: data.mortalityCount,
            }),
            ...(data.harvestQuantity !== undefined && {
              harvestQuantity: data.harvestQuantity,
            }),
            ...(data.harvestUnit !== undefined && { harvestUnit: data.harvestUnit }),
            ...(data.harvestPrice !== undefined && { harvestPrice: data.harvestPrice }),
            ...(data.notes !== undefined && { notes: data.notes }),
            ...(data.photoRef !== undefined && { photoRef: data.photoRef }),
          },
        });

        return res.status(200).json(updatedLog);
      } catch (err) {
        console.error('Error updating log:', err);
        return res.status(500).json({ error: 'ไม่สามารถแก้ไขบันทึกได้' });
      }
    }

    if (method === 'DELETE') {
      try {
        await prisma.pondLog.delete({
          where: { id: logId },
        });
        return res.status(200).json({ message: 'ลบบันทึกเรียบร้อยแล้ว' });
      } catch (err) {
        console.error('Error deleting log:', err);
        return res.status(500).json({ error: 'ไม่สามารถลบบันทึกได้' });
      }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Collection operations (/api/logs)
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
