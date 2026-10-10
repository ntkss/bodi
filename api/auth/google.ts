import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_lib/prisma.js';
import { verifyGoogleIdToken, signSessionToken } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    // Upsert User in database
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
      include: { farms: true },
    });

    if (!user) {
      // First time sign-up: create User and initial Farm
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
      // Update Google info if needed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId || googleUser.googleId,
          avatarUrl: googleUser.avatarUrl || user.avatarUrl,
          name: user.name || googleUser.name,
        },
        include: { farms: true },
      });

      // Ensure user has at least one farm
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
