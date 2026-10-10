import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_lib/prisma.js';
import { PondUpdateSchema } from '../_lib/validators.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const pondId = String(id);

  if (!pondId) {
    return res.status(400).json({ error: 'ไม่พบรหัสบ่อ (Pond ID)' });
  }

  // GET: Single pond with all logs
  if (req.method === 'GET') {
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

  // PUT / PATCH: Update pond
  if (req.method === 'PUT' || req.method === 'PATCH') {
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

      return res.status(200).json(updated);
    } catch (err) {
      console.error('Error updating pond:', err);
      return res.status(500).json({ error: 'ไม่สามารถอัปเดตข้อมูลบ่อได้' });
    }
  }

  // DELETE: Remove pond
  if (req.method === 'DELETE') {
    try {
      await prisma.pond.delete({
        where: { id: pondId },
      });
      return res.status(200).json({ message: 'ลบข้อมูลบ่อเรียบร้อยแล้ว' });
    } catch (err) {
      console.error('Error deleting pond:', err);
      return res.status(500).json({ error: 'ไม่สามารถลบบ่อได้' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
