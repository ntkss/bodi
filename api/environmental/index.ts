import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_lib/prisma.js';
import { getAuthContext } from '../_lib/auth.js';
import {
  ReferenceStationInputSchema,
  EnvironmentalReadingInputSchema,
} from '../_lib/validators.js';
import { DEFAULT_SAMUT_SONGKHRAM_STATIONS } from '../_lib/environmental.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await getAuthContext(req);
  if (!auth) {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' });
  }

  const farmId = auth.farm.id;

  // GET: Fetch all reference stations and their latest readings for this farm
  if (req.method === 'GET') {
    try {
      let stations = await prisma.referenceStation.findMany({
        where: {
          OR: [{ farmId: farmId }, { farmId: null }],
        },
        include: {
          readings: {
            orderBy: { observedAt: 'desc' },
            take: 10,
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      // Auto-populate default Samut Songkhram candidate stations if table is empty
      if (stations.length === 0) {
        for (const defaultStation of DEFAULT_SAMUT_SONGKHRAM_STATIONS) {
          await prisma.referenceStation.create({
            data: {
              farmId,
              provider: defaultStation.provider,
              providerStationId: defaultStation.providerStationId,
              name: defaultStation.name,
              sourceUrl: defaultStation.sourceUrl,
              latitude: defaultStation.latitude,
              longitude: defaultStation.longitude,
              parameters: defaultStation.parameters,
              units: defaultStation.units,
              relevanceNotes: defaultStation.relevanceNotes,
              verificationStatus: defaultStation.verificationStatus,
            },
          });
        }

        stations = await prisma.referenceStation.findMany({
          where: {
            OR: [{ farmId: farmId }, { farmId: null }],
          },
          include: {
            readings: {
              orderBy: { observedAt: 'desc' },
              take: 10,
            },
          },
          orderBy: { createdAt: 'asc' },
        });
      }

      // Format response with computed freshness status for latest reading
      const now = new Date();
      const formatted = stations.map((st) => {
        const latestReading = st.readings[0] || null;
        let freshness: 'FRESH' | 'STALE' | 'NO_DATA' = 'NO_DATA';

        if (latestReading) {
          const ageHours =
            (now.getTime() - new Date(latestReading.observedAt).getTime()) /
            (1000 * 60 * 60);
          freshness = ageHours <= 3 ? 'FRESH' : 'STALE';
        }

        return {
          ...st,
          latestReading,
          freshness,
        };
      });

      // Farm context for risk assessment
      const farm = await prisma.farm.findUnique({
        where: { id: farmId },
        select: {
          waterSourceCanal: true,
          latitude: true,
          longitude: true,
        },
      });

      const { evaluateWaterRiskSummary, predictPakNamMaeKlongTide } = await import(
        '../_lib/environmental.js'
      );

      const riskAssessment = evaluateWaterRiskSummary({
        stations: formatted,
        farm,
        referenceTime: now,
      });

      const tideWindow = predictPakNamMaeKlongTide(now);

      if (req.query.format === 'array') {
        return res.status(200).json(formatted);
      }

      return res.status(200).json({
        stations: formatted,
        riskAssessment,
        tideWindow,
      });
    } catch (err) {
      console.error('Error fetching environmental reference stations:', err);
      return res
        .status(500)
        .json({ error: 'ไม่สามารถดึงข้อมูลสถานีอ้างอิงสภาพแวดล้อมได้' });
    }
  }

  // POST: Add a new reference station or manually add an environmental reading
  if (req.method === 'POST') {
    const action = req.query.action as string;

    // Action A: Add reading to station
    if (action === 'reading') {
      try {
        const parseResult = EnvironmentalReadingInputSchema.safeParse(req.body);
        if (!parseResult.success) {
          return res.status(400).json({
            error: 'ข้อมูลการตรวจวัดไม่ถูกต้อง',
            details: parseResult.error.flatten().fieldErrors,
          });
        }

        const data = parseResult.data;
        // Verify station exists
        const station = await prisma.referenceStation.findUnique({
          where: { id: data.stationId },
        });
        if (!station) {
          return res.status(404).json({ error: 'ไม่พบสถานีอ้างอิงที่ระบุ' });
        }

        const newReading = await prisma.environmentalReading.create({
          data: {
            stationId: data.stationId,
            parameter: data.parameter,
            value: data.value,
            unit: data.unit,
            observedAt: data.observedAt,
            fetchedAt: data.fetchedAt || new Date(),
            status: data.status,
            sourceRecordId: data.sourceRecordId,
          },
        });

        // Update station lastCheckedAt
        await prisma.referenceStation.update({
          where: { id: data.stationId },
          data: { lastCheckedAt: new Date() },
        });

        return res.status(201).json(newReading);
      } catch (err) {
        console.error('Error creating environmental reading:', err);
        return res.status(500).json({ error: 'ไม่สามารถบันทึกข้อมูลการตรวจวัดได้' });
      }
    }

    // Action B: Create reference station
    try {
      const parseResult = ReferenceStationInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'ข้อมูลสถานีอ้างอิงไม่ถูกต้อง',
          details: parseResult.error.flatten().fieldErrors,
        });
      }

      const data = parseResult.data;
      const newStation = await prisma.referenceStation.create({
        data: {
          farmId: data.farmId || farmId,
          provider: data.provider,
          providerStationId: data.providerStationId,
          name: data.name,
          sourceUrl: data.sourceUrl,
          latitude: data.latitude,
          longitude: data.longitude,
          parameters: data.parameters,
          units: data.units,
          relevanceNotes: data.relevanceNotes,
          verificationStatus: data.verificationStatus,
        },
      });

      return res.status(201).json(newStation);
    } catch (err) {
      console.error('Error creating reference station:', err);
      return res.status(500).json({ error: 'ไม่สามารถเพิ่มสถานีอ้างอิงใหม่ได้' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
