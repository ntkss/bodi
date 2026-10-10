import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_lib/prisma.js';
import { getAuthContext } from '../_lib/auth.js';
import { FarmUpdateSchema } from '../_lib/validators.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await getAuthContext(req);
  if (!auth) {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' });
  }

  const farmId = auth.farm.id;

  // GET: Fetch current farm profile including location & water source
  if (req.method === 'GET') {
    try {
      const farm = await prisma.farm.findUnique({
        where: { id: farmId },
        include: {
          referenceStations: {
            include: {
              readings: {
                orderBy: { observedAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      });

      if (!farm) {
        return res.status(404).json({ error: 'ไม่พบข้อมูลฟาร์ม' });
      }

      return res.status(200).json(farm);
    } catch (err) {
      console.error('Error fetching farm profile:', err);
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลฟาร์มได้' });
    }
  }

  // PATCH / PUT: Update farm location and water source configuration
  if (req.method === 'PATCH' || req.method === 'PUT') {
    try {
      const parseResult = FarmUpdateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'ข้อมูลฟาร์มไม่ถูกต้อง',
          details: parseResult.error.flatten().fieldErrors,
        });
      }

      const data = parseResult.data;
      const updatedFarm = await prisma.farm.update({
        where: { id: farmId },
        data: {
          name: data.name,
          timezone: data.timezone,
          province: data.province,
          district: data.district,
          subdistrict: data.subdistrict,
          latitude: data.latitude,
          longitude: data.longitude,
          waterSourceCanal: data.waterSourceCanal,
          tidalInfluence: data.tidalInfluence,
          waterPathNotes: data.waterPathNotes,
        },
      });

      return res.status(200).json(updatedFarm);
    } catch (err) {
      console.error('Error updating farm profile:', err);
      return res.status(500).json({ error: 'ไม่สามารถอัปเดตข้อมูลฟาร์มได้' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
