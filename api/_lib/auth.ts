import crypto from 'node:crypto';
import type { VercelRequest } from '@vercel/node';
import prisma from './prisma.js';

const JWT_SECRET =
  process.env.JWT_SECRET || 'bodi-smart-farm-aquaculture-secret-jwt-key-2026';

export interface UserSessionPayload {
  userId: string;
  farmId: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Creates a simple base64url encoded HMAC-SHA256 JWT
 */
export function signSessionToken(
  payload: UserSessionPayload,
  expiresInSeconds = 30 * 24 * 60 * 60
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp, iat: Math.floor(Date.now() / 1000) };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64url');

  return `${data}.${signature}`;
}

/**
 * Verifies and decodes a session JWT
 */
export function verifySessionToken(token: string): UserSessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(data)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf-8')
    );

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return {
      userId: payload.userId,
      farmId: payload.farmId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

/**
 * Verifies a Google ID token by calling Google's tokeninfo API.
 */
export async function verifyGoogleIdToken(idToken: string) {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as {
      sub?: string;
      email?: string;
      name?: string;
      picture?: string;
      email_verified?: string | boolean;
    };

    if (!data.sub || !data.email) {
      return null;
    }

    return {
      googleId: data.sub,
      email: data.email.toLowerCase(),
      name: data.name || data.email.split('@')[0],
      avatarUrl: data.picture || null,
    };
  } catch {
    return null;
  }
}

/**
 * Extracts authenticated user & farm from incoming VercelRequest
 */
export async function getAuthContext(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7).trim();
  const session = verifySessionToken(token);
  if (!session) {
    return null;
  }

  // Verify user and farm exist in DB
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { farms: true },
  });

  if (!user) {
    return null;
  }

  const farm = user.farms.find((f) => f.id === session.farmId) || user.farms[0] || null;

  if (!farm) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
    farm: {
      id: farm.id,
      name: farm.name,
      timezone: farm.timezone,
    },
  };
}
