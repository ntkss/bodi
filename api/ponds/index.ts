import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_lib/prisma.js';
import { PondInputSchema } from '../_lib/validators.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;

  if (method === 'GET') {
    try {
      const { farmId } = req.query;
      const whereClause = farmId ? { farmId: String(farmId) } : {};

      const ponds = await prisma.pond.findMany({
        where: whereClause,
        include: {
          logs: {
            orderBy: { recordedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      const formatted = ponds.map((p) => ({
        ...p,
        area: p.area ? Number(p.area) : null,
        latestLog: p.logs[0] || null,
      }));

      return res.status(200).json(formatted);
    } catch (err) {
      console.error('Error fetching ponds:', err);
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลบ่อได้' });
    }
  }

  if (method === 'POST') {
    try {
      const parseResult = PondInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'ข้อมูลไม่ถูกต้อง',
          details: parseResult.error.flatten().fieldErrors,
        });
      }

      const data = parseResult.data;
      const newPond = await prisma.pond.create({
        data: {
          farmId: data.farmId,
          name: data.name,
          area: data.area,
          waterSource: data.waterSource,
          species: data.species,
          farmingMethod: data.farmingMethod,
          status: data.status,
          notes: data.notes,
        },
      });

      return res.status(201).json(newPond);
    } catch (err) {
      console.error('Error creating pond:', err);
      return res.status(500).json({ error: 'ไม่สามารถสร้างบ่อใหม่ได้' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
