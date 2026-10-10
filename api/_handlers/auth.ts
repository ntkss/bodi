import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_lib/prisma.js';
import { getAuthContext, signSessionToken, verifyGoogleIdToken } from '../_lib/auth.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  action?: string
) {
  const currentAction = action || (req.query.action as string) || '';

  // 1. GET /api/auth/me
  if (currentAction === 'me') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const auth = await getAuthContext(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({
      user: auth.user,
      farm: auth.farm,
    });
  }

  // 2. POST /api/auth/dev-login
  if (currentAction === 'dev-login') {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Dev login is only available in development' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
      let user = await prisma.user.findFirst({
        where: { email: 'somchai@bodi.farm' },
        include: { farms: true },
      });

      if (!user) {
        user = await prisma.user.findFirst({
          include: { farms: true },
        });
      }

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'somchai@bodi.farm',
            name: 'ลุงสมชาย ช่างเขียน (ทดสอบระบบ)',
            role: 'FARMER',
            farms: {
              create: {
                name: 'บ่อดี ฟาร์มลุงสมชาย (สมุทรสงคราม)',
                timezone: 'Asia/Bangkok',
                province: 'สมุทรสงคราม',
                district: 'เมืองสมุทรสงคราม',
                subdistrict: 'ลาดใหญ่',
                latitude: 13.4098,
                longitude: 99.9965,
                waterSourceCanal: 'คลองแม่กลอง / คลองสุนทรวิจิตร',
                tidalInfluence: 'DIRECT',
                waterPathNotes:
                  'รับน้ำเค็มตามจังหวะน้ำขึ้นจากปากอ่าวแม่กลอง ผ่านคลองแยกประมาณ 3.2 กม.',
              },
            },
          },
          include: { farms: true },
        });
      }

      let primaryFarm = user.farms[0];
      if (!primaryFarm) {
        primaryFarm = await prisma.farm.create({
          data: {
            userId: user.id,
            name: `ฟาร์มของ${user.name}`,
            timezone: 'Asia/Bangkok',
            province: 'สมุทรสงคราม',
          },
        });
      }

      const token = signSessionToken({
        userId: user.id,
        farmId: primaryFarm.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
        farm: {
          id: primaryFarm.id,
          name: primaryFarm.name,
          timezone: primaryFarm.timezone,
          province: primaryFarm.province,
          district: primaryFarm.district,
          subdistrict: primaryFarm.subdistrict,
          latitude: primaryFarm.latitude,
          longitude: primaryFarm.longitude,
          waterSourceCanal: primaryFarm.waterSourceCanal,
          tidalInfluence: primaryFarm.tidalInfluence,
          waterPathNotes: primaryFarm.waterPathNotes,
        },
      });
    } catch (err) {
      console.error('Dev login error:', err);
      return res.status(500).json({
        error: 'เข้าสู่ระบบทดสอบไม่สำเร็จ',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // 3. POST /api/auth/google
  if (currentAction === 'google') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { credential } = req.body || {};
    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid Google credential' });
    }

    try {
      const googleUser = await verifyGoogleIdToken(credential);
      if (!googleUser) {
        return res.status(401).json({ error: 'Google credential validation failed' });
      }

      let user = await prisma.user.findUnique({
        where: { email: googleUser.email },
        include: { farms: true },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name,
            googleId: googleUser.googleId,
            avatarUrl: googleUser.avatarUrl,
            farms: {
              create: {
                name: `ฟาร์มของ${googleUser.name}`,
                timezone: 'Asia/Bangkok',
              },
            },
          },
          include: { farms: true },
        });
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: user.googleId || googleUser.googleId,
            avatarUrl: googleUser.avatarUrl || user.avatarUrl,
            name: user.name || googleUser.name,
          },
          include: { farms: true },
        });

        if (user.farms.length === 0) {
          const farm = await prisma.farm.create({
            data: {
              userId: user.id,
              name: `ฟาร์มของ${user.name}`,
              timezone: 'Asia/Bangkok',
            },
          });
          user.farms.push(farm);
        }
      }

      const primaryFarm = user.farms[0];
      const sessionToken = signSessionToken({
        userId: user.id,
        farmId: primaryFarm.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      return res.status(200).json({
        success: true,
        token: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
        farm: {
          id: primaryFarm.id,
          name: primaryFarm.name,
          timezone: primaryFarm.timezone,
        },
      });
    } catch (error) {
      console.error('Google auth error:', error);
      return res.status(500).json({
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown server error',
      });
    }
  }

  return res.status(404).json({ error: 'Auth action not found' });
}
