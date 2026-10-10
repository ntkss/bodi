import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_lib/prisma.js';
import { getAuthContext } from '../_lib/auth.js';
import { fetchOpenMeteoEnvironmentalData } from '../_lib/environmental.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const auth = await getAuthContext(req);
  if (!auth) {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' });
  }

  const farmId = auth.farm.id;

  try {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: {
        referenceStations: true,
      },
    });

    if (!farm) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลฟาร์ม' });
    }

    // Determine coordinates to query: farm coordinates or Samut Songkhram center
    const lat = farm.latitude ?? 13.4098;
    const lng = farm.longitude ?? 99.9965;

    // Find or create Open-Meteo ReferenceStation for this farm
    let station = farm.referenceStations.find((s) => s.provider === 'OPEN_METEO');

    if (!station) {
      station = await prisma.referenceStation.create({
        data: {
          farmId,
          provider: 'OPEN_METEO',
          providerStationId: 'open-meteo-samut-songkhram',
          name: 'สถานีตรวจวัดสภาพอากาศ สมุทรสงคราม (Open-Meteo)',
          sourceUrl: 'https://open-meteo.com/en/docs',
          latitude: lat,
          longitude: lng,
          parameters: 'precipitation,rain,temperature,relative_humidity',
          units: 'mm, °C, %',
          relevanceNotes:
            'ข้อมูลสภาพอากาศและฝนในรัศมีฟาร์ม ใช้เฝ้าระวังฝนชะล้างและความเค็มผันผวน',
          verificationStatus: 'VERIFIED',
        },
      });
    }

    // Call external Open-Meteo API server-side
    const normalizedReadings = await fetchOpenMeteoEnvironmentalData(lat, lng);

    // Save normalized readings into database
    const savedReadings = [];
    for (const r of normalizedReadings) {
      const created = await prisma.environmentalReading.create({
        data: {
          stationId: station.id,
          parameter: r.parameter,
          value: r.value,
          unit: r.unit,
          observedAt: r.observedAt,
          fetchedAt: r.fetchedAt,
          status: r.status,
          sourceRecordId: r.sourceRecordId,
        },
      });
      savedReadings.push(created);
    }

    // Update station lastCheckedAt
    await prisma.referenceStation.update({
      where: { id: station.id },
      data: {
        lastCheckedAt: new Date(),
        verificationStatus: 'VERIFIED',
      },
    });

    return res.status(200).json({
      success: true,
      stationId: station.id,
      stationName: station.name,
      readingsCount: savedReadings.length,
      readings: savedReadings,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error syncing environmental data:', err);
    return res.status(502).json({
      error: 'ไม่สามารถดึงข้อมูลจากแหล่งข้อมูลภายนอกได้',
      details: err instanceof Error ? err.message : 'Unknown sync error',
    });
  }
}
