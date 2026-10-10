import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_lib/prisma.js';
import { signSessionToken } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow dev login in development mode only
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Dev login is only available in development' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Find or create default demo farmer (Uncle Somchai)
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
              waterPathNotes: 'รับน้ำเค็มตามจังหวะน้ำขึ้นจากปากอ่าวแม่กลอง ผ่านคลองแยกประมาณ 3.2 กม.',
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
