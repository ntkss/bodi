import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting BODI database seed...');

  // Clean existing demo data (if any) in reverse order
  await prisma.environmentalReading.deleteMany();
  await prisma.referenceStation.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.financeTransaction.deleteMany();
  await prisma.pondLog.deleteMany();
  await prisma.pond.deleteMany();
  await prisma.farm.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Demo User (Farmer Uncle Somchai)
  const user = await prisma.user.create({
    data: {
      email: 'somchai@bodi.farm',
      name: 'ลุงสมชาย ช่างเขียน',
      passwordHash: 'argon2_or_bcrypt_mock_hash_for_seed_farmer_somchai',
      role: 'FARMER',
    },
  });

  // 2. Create Farm with Location & Water Path (Samut Songkhram target area)
  const farm = await prisma.farm.create({
    data: {
      userId: user.id,
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
        'รับน้ำเค็มตามจังหวะน้ำขึ้นจากปากอ่าวแม่กลอง ผ่านคลองส่งน้ำแยกประมาณ 3.2 กม. มีประตูท่อระบายน้ำควบคุม',
    },
  });

  // 3. Create Ponds (Natural / Semi-natural shrimp & crab ponds)
  const pond1 = await prisma.pond.create({
    data: {
      farmId: farm.id,
      name: 'บ่อ 1 (บ่อกุ้งธรรมชาติ - กุ้งแชบ๊วย/กุลาดำ)',
      area: new Prisma.Decimal(12.0), // 12 ไร่
      waterSource: 'น้ำคลองธรรมชาติ (ปากอ่าวคลองด่าน)',
      species: 'กุ้งแชบ๊วย, กุ้งกุลาดำ',
      farmingMethod: 'ธรรมชาติ (ไม่ใช้อาหารเม็ด รับลูกกุ้งตามน้ำหลาก)',
      status: 'ACTIVE',
      notes: 'บ่อเปิดรับน้ำช่วงน้ำเกิด 1-3 ค่ำ ไม่ต้องให้อาหารสำเร็จรูป',
    },
  });

  const pond2 = await prisma.pond.create({
    data: {
      farmId: farm.id,
      name: 'บ่อ 2 (บ่อปูดำธรรมชาติ)',
      area: new Prisma.Decimal(8.5), // 8.5 ไร่
      waterSource: 'น้ำคลองชายเลนธรรมชาติ',
      species: 'ปูดำทะเล',
      farmingMethod: 'กึ่งธรรมชาติ (ให้ปลาเป็ดเสริมเป็นครั้งคราว)',
      status: 'ACTIVE',
      notes: 'มีแนวชะลอน้ำและไม้โกงกางให้ร่มเงา',
    },
  });

  const pond3 = await prisma.pond.create({
    data: {
      farmId: farm.id,
      name: 'บ่อ 3 (บ่อพักน้ำ / ตากก้นบ่อ)',
      area: new Prisma.Decimal(5.0), // 5 ไร่
      waterSource: 'น้ำคลองธรรมชาติ',
      species: null, // บ่อพักน้ำ ไม่มีสัตว์น้ำ
      farmingMethod: 'บ่อพักและตกตะกอน',
      status: 'RESTING',
      notes: 'ตากก้นบ่อปรับสภาพดินเลนเตรียมรับน้ำรอบต่อไป',
    },
  });

  // 4. Create Pond Logs
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // Pond 1 Logs: Water reading
  await prisma.pondLog.create({
    data: {
      pondId: pond1.id,
      type: 'WATER_QUALITY',
      recordedAt: twoHoursAgo,
      temperature: 29.5,
      ph: 7.8,
      salinity: 18.0,
      dissolvedOxygen: 4.8,
      notes: 'น้ำสีเขียวมะกอกใส กุ้งกระจายตัวหากินปกติ',
    },
  });

  await prisma.pondLog.create({
    data: {
      pondId: pond1.id,
      type: 'WATER_EXCHANGE',
      recordedAt: threeDaysAgo,
      exchangeType: 'IN',
      exchangeVolume: 'รับน้ำเข้า 30 ซม.',
      notes: 'เปิดท่อรับน้ำทะเลช่วงน้ำขึ้นรอบเช้า',
    },
  });

  // Pond 2 Logs: Animal Observation (Water quality absent -> demonstrates "ไม่มีข้อมูลล่าสุด")
  await prisma.pondLog.create({
    data: {
      pondId: pond2.id,
      type: 'ANIMAL_OBSERVATION',
      recordedAt: yesterday,
      observation: 'ปูดำออกหากินตามซอกขอนไม้ อาการปกติ ไม่พบตัวตาย',
      mortalityCount: 0,
      notes: 'ให้ปลาเป็ดสับ 15 กิโลกรัม',
    },
  });

  // Pond 3 Logs: General resting note
  await prisma.pondLog.create({
    data: {
      pondId: pond3.id,
      type: 'GENERAL_NOTE',
      recordedAt: yesterday,
      notes: 'ตากก้นบ่อวันที่ 5 ดินแห้งแตกลายงาดี โรยปูนขาวตามขอบบ่อเรียบร้อย',
    },
  });

  // 5. Create Finance Transactions (Income & Expense)
  await prisma.financeTransaction.create({
    data: {
      farmId: farm.id,
      pondId: pond1.id,
      type: 'INCOME',
      category: 'ขายกุ้งแชบ๊วยธรรมชาติ',
      amount: new Prisma.Decimal('42500.00'),
      occurredAt: yesterday,
      note: 'คัดไซส์ 40 ตัว/กก. ส่งแพเจ๊นา คลองด่าน',
    },
  });

  await prisma.financeTransaction.create({
    data: {
      farmId: farm.id,
      pondId: pond2.id,
      type: 'INCOME',
      category: 'ขายปูดำคัดไซส์',
      amount: new Prisma.Decimal('18200.00'),
      occurredAt: twoHoursAgo,
      note: 'ปูดำเนื้อแน่นคัดเกรด 3 ตัวโล',
    },
  });

  await prisma.financeTransaction.create({
    data: {
      farmId: farm.id,
      pondId: pond1.id,
      type: 'EXPENSE',
      category: 'ค่าน้ำมันเครื่องสูบน้ำ',
      amount: new Prisma.Decimal('3500.00'),
      occurredAt: threeDaysAgo,
      note: 'น้ำมันดีเซลสำหรับเครื่องสูบน้ำ 8 นิ้ว 100 ลิตร',
    },
  });

  await prisma.financeTransaction.create({
    data: {
      farmId: farm.id,
      pondId: pond2.id,
      type: 'EXPENSE',
      category: 'ค่าอาหารปลาเป็ด',
      amount: new Prisma.Decimal('1400.00'),
      occurredAt: yesterday,
      note: 'ปลาเป็ดบดสดสำหรับบ่อปูดำ',
    },
  });

  await prisma.financeTransaction.create({
    data: {
      farmId: farm.id,
      pondId: pond3.id,
      type: 'EXPENSE',
      category: 'ค่าปูนขาวปรับสภาพดิน',
      amount: new Prisma.Decimal('1200.00'),
      occurredAt: yesterday,
      note: 'ปูนขาวโรยตากบ่อ 10 กระสอบ',
    },
  });

  // 6. Create Alert
  await prisma.alert.create({
    data: {
      pondId: pond1.id,
      title: 'เฝ้าระวังออกซิเจนละลายน้ำ (DO) ช่วงเช้ามืด',
      message: 'บ่อ 1 มีสภาพอากาศปิดช่วงเช้า ควรเดินตรวจคันบ่อสังเกตอาการกุ้งลอยหัว',
      severity: 'WARNING',
      status: 'UNREAD',
      dedupeKey: `ALERT_POND1_DO_CHECK_${now.toISOString().slice(0, 10)}`,
      createdAt: now,
    },
  });

  // 7. Create Reference Stations (Milestone 1 — Data Discovery & Station Setup)
  const stationOpenMeteo = await prisma.referenceStation.create({
    data: {
      farmId: farm.id,
      provider: 'OPEN_METEO',
      providerStationId: 'open-meteo-samut-songkhram',
      name: 'สถานีตรวจวัดสภาพอากาศ สมุทรสงคราม (Open-Meteo)',
      sourceUrl: 'https://open-meteo.com/en/docs',
      latitude: 13.4098,
      longitude: 99.9965,
      parameters: 'precipitation,rain,temperature,relative_humidity',
      units: 'mm, °C, %',
      relevanceNotes:
        'ข้อมูลฝนและสภาพอากาศในพื้นที่สมุทรสงคราม ใช้เฝ้าระวังฝนชะหน้าดินและความเค็มลดลงกระทันหัน (ฟรีเพื่อการศึกษา/ทดสอบแบบ non-commercial <10,000 ครั้ง/วัน อ้างอิง CC BY 4.0)',
      verificationStatus: 'VERIFIED',
      lastCheckedAt: now,
    },
  });

  const stationNavy = await prisma.referenceStation.create({
    data: {
      farmId: farm.id,
      provider: 'NAVY_HYDRO',
      providerStationId: 'PAK_NAM_MAE_KLONG_MK',
      name: 'สถานีมาตราน้ำปากน้ำแม่กลอง (กรมอุทกศาสตร์ กองทัพเรือ)',
      sourceUrl: 'https://hydro.navy.mi.th/waterlaveltable',
      latitude: 13.355,
      longitude: 100.005,
      parameters: 'tide_prediction',
      units: 'm (LLW / MSL)',
      relevanceNotes:
        'มาตราน้ำทำนายรายปีทางดาราศาสตร์บริเวณปากอ่าวแม่กลอง สำหรับวางแผนจังหวะเปิด-ปิดประตูระบายน้ำ (ข้อควรระวัง: เป็นระดับน้ำทำนาย ไม่ใช่ระดับน้ำตรวจวัดจริงในคลองซอย)',
      verificationStatus: 'CANDIDATE',
    },
  });

  await prisma.referenceStation.create({
    data: {
      farmId: farm.id,
      provider: 'THAI_WATER',
      providerStationId: 'HII_MAE_KLONG',
      name: 'สถาบันสารสนเทศทรัพยากรน้ำ (สสน. / ThaiWater)',
      sourceUrl: 'https://standard.thaiwater.net',
      latitude: 13.41,
      longitude: 99.99,
      parameters: 'rainfall,water_level,runoff',
      units: 'mm, m (MSL)',
      relevanceNotes:
        'มาตรฐานการแลกเปลี่ยนข้อมูลน้ำภาครัฐ ไม่มี Public REST API สาธารณะสำหรับบุคคลที่สามโดยไม่มีข้อตกลงร่วม (MoU) สถานะปัจจุบันถูกระงับการเชื่อมต่อตรง',
      verificationStatus: 'BLOCKED',
    },
  });

  await prisma.referenceStation.create({
    data: {
      farmId: farm.id,
      provider: 'PCD_IWIS',
      providerStationId: 'PCD_IWIS_MAE_KLONG',
      name: 'กรมควบคุมมลพิษ IWIS (แม่น้ำแม่กลองตอนล่าง)',
      sourceUrl: 'https://iwis.pcd.go.th',
      latitude: 13.38,
      longitude: 99.99,
      parameters: 'dissolved_oxygen,salinity,ph',
      units: 'mg/L, ppt',
      relevanceNotes:
        'ระบบติดตามคุณภาพน้ำผิวดิน ให้บริการเฉพาะหน้าเว็บแดชบอร์ด ไม่มี Documented Open API สาธารณะที่ใช้งานได้สำหรับแอปทั่วไป',
      verificationStatus: 'BLOCKED',
    },
  });

  // Seed verified environmental readings for Open-Meteo station
  await prisma.environmentalReading.create({
    data: {
      stationId: stationOpenMeteo.id,
      parameter: 'precipitation',
      value: 0.0,
      unit: 'mm',
      observedAt: twoHoursAgo,
      fetchedAt: now,
      status: 'VALID',
      sourceRecordId: `seed-precip-${now.getTime()}`,
    },
  });

  await prisma.environmentalReading.create({
    data: {
      stationId: stationOpenMeteo.id,
      parameter: 'temperature',
      value: 29.2,
      unit: '°C',
      observedAt: twoHoursAgo,
      fetchedAt: now,
      status: 'VALID',
      sourceRecordId: `seed-temp-${now.getTime()}`,
    },
  });

  // Seed sample tide prediction for Navy station (marked CANDIDATE / manual import)
  await prisma.environmentalReading.create({
    data: {
      stationId: stationNavy.id,
      parameter: 'tide_level',
      value: 2.85,
      unit: 'm (LLW)',
      observedAt: now,
      fetchedAt: now,
      status: 'VALID',
      sourceRecordId: 'seed-navy-tide-import-mk2026',
    },
  });

  console.log('✅ Seed data inserted successfully:');
  console.log(` - User: ${user.name} (${user.email})`);
  console.log(` - Farm: ${farm.name}`);
  console.log(` - Location: ${farm.province} อ.${farm.district} ต.${farm.subdistrict}`);
  console.log(` - Ponds: 3 ponds created (2 active, 1 resting)`);
  console.log(` - Pond Logs: 4 logs created`);
  console.log(` - Transactions: 2 incomes, 3 expenses`);
  console.log(` - Alerts: 1 active alert`);
  console.log(
    ` - Reference Stations: 4 stations configured (1 verified, 1 candidate, 2 blocked)`
  );
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
