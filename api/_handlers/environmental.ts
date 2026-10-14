import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_lib/prisma.js';
import { getAuthContext } from '../_lib/auth.js';
import {
  ReferenceStationInputSchema,
  EnvironmentalReadingInputSchema,
} from '../_lib/validators.js';
import {
  DEFAULT_SAMUT_SONGKHRAM_STATIONS,
  fetchOpenMeteoEnvironmentalData,
  fetchThaiWaterQualityData,
  filterRelevantThaiWaterStations,
  evaluateWaterRiskSummary,
  predictPakNamMaeKlongTide,
  evaluateEnvironmentalAlerts,
} from '../_lib/environmental.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  action?: string
) {
  const auth = await getAuthContext(req);
  if (!auth) {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' });
  }

  const farmId = auth.farm.id;
  const currentAction = action || (req.query.action as string) || '';

  // 1. Sync endpoint: POST /api/environmental/sync
  if (currentAction === 'sync') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

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

      const lat = farm.latitude ?? 13.4098;
      const lng = farm.longitude ?? 99.9965;

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

      const normalizedReadings = await fetchOpenMeteoEnvironmentalData(lat, lng);

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

      await prisma.referenceStation.update({
        where: { id: station.id },
        data: {
          lastCheckedAt: new Date(),
          verificationStatus: 'VERIFIED',
        },
      });

      // 2. Sync ThaiWater Quality stations for the farm's river basin
      try {
        const rawThaiWater = await fetchThaiWaterQualityData(7000);
        const relevantThaiWater = filterRelevantThaiWaterStations(rawThaiWater, lat, lng, 3);

        for (const tws of relevantThaiWater) {
          let dbTwStation = await prisma.referenceStation.findFirst({
            where: {
              farmId,
              provider: 'THAI_WATER',
              providerStationId: tws.providerStationId,
            },
          });

          if (!dbTwStation) {
            dbTwStation = await prisma.referenceStation.create({
              data: {
                farmId,
                provider: 'THAI_WATER',
                providerStationId: tws.providerStationId,
                name: tws.name,
                sourceUrl: tws.sourceUrl,
                latitude: tws.latitude,
                longitude: tws.longitude,
                parameters: 'salinity,dissolved_oxygen,ph,turbidity,tds,conductivity,temperature',
                units: 'g/L, mg/L, pH, ntu, mg/L, µS/cm, °C',
                relevanceNotes: tws.relevanceNotes,
                verificationStatus: 'VERIFIED',
                lastCheckedAt: new Date(),
              },
            });
          } else {
            await prisma.referenceStation.update({
              where: { id: dbTwStation.id },
              data: {
                name: tws.name,
                relevanceNotes: tws.relevanceNotes,
                lastCheckedAt: new Date(),
                verificationStatus: 'VERIFIED',
              },
            });
          }

          for (const r of tws.readings) {
            const created = await prisma.environmentalReading.create({
              data: {
                stationId: dbTwStation.id,
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
        }
      } catch (twErr) {
        console.warn('Non-blocking ThaiWater quality sync error:', twErr);
      }

      const updatedStations = await prisma.referenceStation.findMany({
        where: {
          OR: [{ farmId: farmId }, { farmId: null }],
          verificationStatus: { not: 'BLOCKED' },
        },
        include: {
          readings: {
            orderBy: { observedAt: 'desc' },
            take: 10,
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      const now = new Date();
      const formatted = updatedStations.map((st) => {
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

      const riskAssessment = evaluateWaterRiskSummary({
        stations: formatted,
        farm,
        referenceTime: now,
      });

      const tideWindow = predictPakNamMaeKlongTide(now);

      // Evaluate Environmental Alert Rules (Rain, Tide, and River Low DO)
      const weatherStation = formatted.find((s) => s.provider === 'OPEN_METEO');
      const waterQualityStations = formatted.filter((s) => s.provider === 'THAI_WATER');
      const recentAlerts = await prisma.alert.findMany({
        where: {
          pondId: null,
          createdAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          },
        },
        select: { dedupeKey: true },
      });

      const evaluatedAlerts = evaluateEnvironmentalAlerts({
        farmId,
        weatherStation,
        waterQualityStations,
        tideWindow,
        referenceTime: now,
        existingAlerts: recentAlerts,
      });

      const createdAlerts = [];
      for (const ea of evaluatedAlerts) {
        if (ea.dedupeKey) {
          const existing = await prisma.alert.findFirst({
            where: { dedupeKey: ea.dedupeKey },
          });
          if (!existing) {
            const created = await prisma.alert.create({
              data: {
                pondId: null,
                title: ea.title,
                message: ea.message,
                severity: ea.severity,
                status: 'UNREAD',
                dedupeKey: ea.dedupeKey,
              },
            });
            createdAlerts.push(created);
          }
        }
      }

      return res.status(200).json({
        success: true,
        stationId: station.id,
        stationName: station.name,
        readingsCount: savedReadings.length,
        readings: savedReadings,
        stations: formatted,
        riskAssessment,
        tideWindow,
        generatedAlerts: createdAlerts,
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

  // 2. Base endpoint: /api/environmental
  if (req.method === 'GET') {
    try {
      // Clean up blocked stations
      await prisma.referenceStation.deleteMany({
        where: {
          verificationStatus: 'BLOCKED',
        },
      });

      let stations = await prisma.referenceStation.findMany({
        where: {
          OR: [{ farmId: farmId }, { farmId: null }],
          verificationStatus: { not: 'BLOCKED' },
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
            verificationStatus: { not: 'BLOCKED' },
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

      const farm = await prisma.farm.findUnique({
        where: { id: farmId },
      });

      const riskAssessment = evaluateWaterRiskSummary({
        stations: formatted,
        farm,
        referenceTime: now,
      });

      const tideWindow = predictPakNamMaeKlongTide(now);

      return res.status(200).json({
        stations: formatted,
        riskAssessment,
        tideWindow,
      });
    } catch (err) {
      console.error('Error fetching environmental stations:', err);
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลสถานีอ้างอิงสภาพแวดล้อมได้' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { type } = req.query;

      if (type === 'reading') {
        const parseResult = EnvironmentalReadingInputSchema.safeParse(req.body);
        if (!parseResult.success) {
          return res.status(400).json({
            error: 'ข้อมูลตรวจวัดไม่ถูกต้อง',
            details: parseResult.error.flatten().fieldErrors,
          });
        }

        const data = parseResult.data;
        const newReading = await prisma.environmentalReading.create({
          data: {
            stationId: data.stationId,
            parameter: data.parameter,
            value: data.value,
            unit: data.unit,
            observedAt: data.observedAt,
            fetchedAt: new Date(),
            status: data.status || 'VALID',
            sourceRecordId: data.sourceRecordId,
          },
        });

        return res.status(201).json(newReading);
      }

      const parseResult = ReferenceStationInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'ข้อมูลสถานีไม่ถูกต้อง',
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
          verificationStatus: 'CANDIDATE',
        },
      });

      return res.status(201).json(newStation);
    } catch (err) {
      console.error('Error creating environmental record:', err);
      return res.status(500).json({ error: 'ไม่สามารถบันทึกข้อมูลได้' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
