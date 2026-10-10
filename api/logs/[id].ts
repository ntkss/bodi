import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_lib/prisma.js';
import { PondLogUpdateSchema } from '../_lib/validators.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const logId = String(id);

  if (!logId) {
    return res.status(400).json({ error: 'ไม่พบรหัสบันทึก (Log ID)' });
  }

  // PUT / PATCH: Edit log to correct mistakes
  if (req.method === 'PUT' || req.method === 'PATCH') {
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

  // DELETE: Remove log
  if (req.method === 'DELETE') {
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
