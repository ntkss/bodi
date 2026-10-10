import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma, { getDatabaseUrl } from './_lib/prisma.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let dbStatus = 'untested';
  let dbError: string | null = null;

  try {
    // Attempt lightweight ping to PostgreSQL if database URL is configured
    const dbUrl = getDatabaseUrl();
    if (dbUrl) {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } else {
      dbStatus = 'unconfigured';
      dbError =
        'ยังไม่ได้ตั้งค่า DATABASE_URL หรือ POSTGRES_PRISMA_URL ใน Vercel Environment Variables';
    }
  } catch (err) {
    dbStatus = 'disconnected';
    dbError = err instanceof Error ? err.message : 'Database connection error';
  }

  return res.status(200).json({
    status: 'ok',
    app: 'บ่อดี (BODI)',
    tagline: 'รู้ทันบ่อ ดูแลง่าย ขายได้ราคา',
    version: '1.0.0',
    timezone: 'Asia/Bangkok',
    serverTime: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
    isoTime: new Date().toISOString(),
    database: {
      status: dbStatus,
      error: dbError,
    },
  });
}
