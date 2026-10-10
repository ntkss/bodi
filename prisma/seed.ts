import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting BODI database seed...');

  // Clean existing demo data (if any) in reverse order
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

  // 2. Create Farm
  const farm = await prisma.farm.create({
    data: {
      userId: user.id,
      name: 'บ่อดี ฟาร์มลุงสมชาย (คลองด่าน)',
      timezone: 'Asia/Bangkok',
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

  console.log('✅ Seed data inserted successfully:');
  console.log(` - User: ${user.name} (${user.email})`);
  console.log(` - Farm: ${farm.name}`);
  console.log(` - Ponds: 3 ponds created (2 active, 1 resting)`);
  console.log(` - Pond Logs: 4 logs created`);
  console.log(` - Transactions: 2 incomes, 3 expenses`);
  console.log(` - Alerts: 1 active alert`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
