import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_lib/prisma.js';
import { PondInputSchema, PondUpdateSchema } from '../_lib/validators.js';
import { getAuthContext } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;
  const auth = await getAuthContext(req);
  const pondId = req.query.id ? String(req.query.id) : null;

  // Single pond operations (with :id)
  if (pondId) {
    if (method === 'GET') {
      try {
        const pond = await prisma.pond.findUnique({
          where: { id: pondId },
          include: {
            logs: {
              orderBy: { recordedAt: 'desc' },
            },
          },
        });

        if (!pond) {
          return res.status(404).json({ error: 'ไม่พบบ่อที่ระบุ' });
        }

        return res.status(200).json({
          ...pond,
          area: pond.area ? Number(pond.area) : null,
        });
      } catch (err) {
        console.error('Error fetching pond detail:', err);
        return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลบ่อได้' });
      }
    }

    if (method === 'PUT' || method === 'PATCH') {
      try {
        const parseResult = PondUpdateSchema.safeParse(req.body);
        if (!parseResult.success) {
          return res.status(400).json({
            error: 'ข้อมูลไม่ถูกต้อง',
            details: parseResult.error.flatten().fieldErrors,
          });
        }

        const data = parseResult.data;
        const updated = await prisma.pond.update({
          where: { id: pondId },
          data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.area !== undefined && { area: data.area }),
            ...(data.waterSource !== undefined && { waterSource: data.waterSource }),
            ...(data.species !== undefined && { species: data.species }),
            ...(data.farmingMethod !== undefined && { farmingMethod: data.farmingMethod }),
            ...(data.status !== undefined && { status: data.status }),
            ...(data.notes !== undefined && { notes: data.notes }),
          },
        });

        return res.status(200).json({
          ...updated,
          area: updated.area ? Number(updated.area) : null,
        });
      } catch (err) {
        console.error('Error updating pond:', err);
        return res.status(500).json({ error: 'ไม่สามารถแก้ไขข้อมูลบ่อได้' });
      }
    }

    if (method === 'DELETE') {
      try {
        await prisma.pond.delete({
          where: { id: pondId },
        });
        return res.status(200).json({ message: 'ลบบ่อเรียบร้อยแล้ว' });
      } catch (err) {
        console.error('Error deleting pond:', err);
        return res.status(500).json({ error: 'ไม่สามารถลบบ่อได้' });
      }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Collection operations (/api/ponds)
  if (method === 'GET') {
    try {
      const targetFarmId = (req.query.farmId as string) || auth?.farm.id;
      const whereClause = targetFarmId ? { farmId: targetFarmId } : {};

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
      const farmId = data.farmId || auth?.farm.id;
      if (!farmId) {
        return res.status(400).json({ error: 'ไม่พบข้อมูล Farm ID' });
      }

      const newPond = await prisma.pond.create({
        data: {
          farmId,
          name: data.name,
          area: data.area,
          waterSource: data.waterSource,
          species: data.species || 'SHRIMP',
          farmingMethod: data.farmingMethod || 'NATURAL',
          status: data.status || 'ACTIVE',
          notes: data.notes,
        },
      });

      return res.status(201).json({
        ...newPond,
        area: newPond.area ? Number(newPond.area) : null,
      });
    } catch (err) {
      console.error('Error creating pond:', err);
      return res.status(500).json({ error: 'ไม่สามารถสร้างบ่อได้' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
