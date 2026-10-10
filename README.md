# บ่อดี (BODI) — Lean Smart Aquaculture MVP

> **คำขวัญ (Tagline):** รู้ทันบ่อ ดูแลง่าย ขายได้ราคา  
> **คำอธิบายผลิตภัณฑ์:** Smart Aquaculture Farm Management Web App  
> **ภาษาหลัก:** ภาษาไทย (Thai-first) ออกแบบเพื่อเกษตรกรและผู้สูงอายุใช้งานง่าย

---

## 1. เกี่ยวกับผลิตภัณฑ์ (About BODI)

**บ่อดี (BODI)** คือเว็บแอปพลิเคชันจัดการฟาร์มสัตว์น้ำขนาดกะทัดรัด สำหรับฟาร์มกุ้ง ปู และหอยแบบครอบครัว ที่เน้นการใช้งานจริงแทนสมุดจด:

- รองรับการเลี้ยงแบบ**ธรรมชาติและกึ่งธรรมชาติ** (เช่น กุ้งแชบ๊วย/กุลาดำ ที่ปล่อยรับลูกกุ้งตามน้ำหลาก ไม่บังคับกรอกวันปล่อยลูกกุ้ง หรือข้อมูลอาหารสำเร็จรูป)
- **ไม่สรุปว่าปลอดภัยเมื่อไม่มีการวัด:** แสดงผลชัดเจนว่า “ไม่มีข้อมูลล่าสุด” แทนการคาดเดา
- ตัวอักษรขนาดใหญ่ ปุ่มสัมผัสขนาดใหญ่ คอนทราสต์ชัดเจน บันทึกข้อมูลประจำวันได้ใน 5 วินาที
- รองรับการใช้งานบนมือถือเป็นหลัก (Mobile-first)

---

## 2. เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4 (Mobile-friendly, Touch-friendly)
- **Deployment:** Vercel (Single deployable codebase)
- **Database & ORM:** PostgreSQL + Prisma ORM (พร้อม Migration และ Decimal-safe money fields)
- **Validation:** Zod (ตรวจสอบความถูกต้องของข้อมูลทุกชนิดที่ส่งเข้า API)
- **Unit Testing:** Vitest (ทดสอบคำนวณการเงิน และความถูกต้องของ Zod Schema)

---

## 3. โครงสร้างฐานข้อมูล (Prisma Models)

สถาปัตยกรรมใช้ตารางเท่าที่จำเป็นในระยะ MVP:

1. `User`: ผู้ใช้งานฟาร์มและการยืนยันตัวตน
2. `Farm`: ฟาร์มเลี้ยงสัตว์น้ำ (เช่น บ่อดี ฟาร์มลุงสมชาย)
3. `Pond`: บ่อเลี้ยง (ระบุพื้นที่ ไร่, แหล่งน้ำ, สายพันธุ์, วิธีการเลี้ยง, สถานะบ่อ)
4. `PondLog`: บันทึกประจำวัน (ค่าน้ำ DO, pH, ความเค็ม, อุณหภูมิ, การถ่ายน้ำ, การสังเกตอาการ, สัตว์น้ำตาย, การจับผลผลิต)
5. `FinanceTransaction`: รายรับ-รายจ่าย (ยอดเงินทศนิยมปลอดภัย Decimal-safe)
6. `Alert`: การแจ้งเตือนเตือนภัยในระบบ (แจ้งเตือน DO ต่ำ, อาการผิดปกติ)

---

## 4. การติดตั้งและเริ่มต้นใช้งาน (Getting Started)

### ความต้องการของระบบ

- Node.js (แนะนำ v20 หรือ v22 ขึ้นไป)
- npm v10 ขึ้นไป
- PostgreSQL Database (รองรับทั้ง Supabase, Neon, Railway หรือ Local PostgreSQL)

### ขั้นตอนติดตั้ง

1. **ติดตั้ง Dependencies**

   ```bash
   npm install
   ```

2. **ตั้งค่า Environment Variables**
   คัดลอกไฟล์ `.env.example` ไปเป็น `.env`

   ```bash
   cp .env.example .env
   ```

   กำหนดค่า `DATABASE_URL` ให้ชี้ไปยังฐานข้อมูล PostgreSQL ของคุณ เช่น:

   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/bodi_db?schema=public"
   ```

3. **สร้าง Prisma Client**

   ```bash
   npm run prisma:generate
   ```

4. **รัน Migration (เมื่อมีฐานข้อมูล PostgreSQL)**

   ```bash
   npm run prisma:migrate
   ```

   _(หรือสามารถนำไฟล์ SQL จาก `prisma/migrations/20261010190000_init_aquaculture_schema/migration.sql` ไปรันในฐานข้อมูลโดยตรง)_

5. **นำเข้าข้อมูลตัวอย่าง (Seed Demo Data)**

   ```bash
   npm run prisma:seed
   ```

6. **เริ่มรันแอปพลิเคชันสำหรับพัฒนา (Development Server)**
   ```bash
   npm run dev
   ```
   เปิดบราวเซอร์ที่: `http://localhost:5173`

---

## 5. คำสั่งที่สำคัญ (NPM Scripts)

| คำสั่ง                    | คำอธิบาย                                                         |
| :------------------------ | :--------------------------------------------------------------- |
| `npm run dev`             | เริ่มต้น Vite Development Server                                 |
| `npm run build`           | รัน Typecheck และสร้าง Production Bundle สำหรับ Deploy           |
| `npm run test`            | รัน Vitest ตรวจสอบ Logic การคำนวณการเงินและ Zod Validators       |
| `npm run typecheck`       | ตรวจสอบประเภทข้อมูล TypeScript ทั่วทั้งโปรเจกต์ (`tsc --noEmit`) |
| `npm run format:check`    | ตรวจสอบรูปแบบโค้ดด้วย Prettier                                   |
| `npm run format`          | จัดรูปแบบโค้ดอัตโนมัติด้วย Prettier (`prettier --write .`)       |
| `npm run prisma:generate` | สร้าง Prisma Client จาก Schema                                   |
| `npm run prisma:migrate`  | รัน Prisma Migration บนฐานข้อมูล                                 |
| `npm run prisma:seed`     | ใส่ข้อมูลจำลองฟาร์มกุ้ง/ปูลุงสมชาย                               |

---

## 6. โครงสร้างไดเรกทอรี (Directory Structure)

```
bodi/
├── api/                      # Vercel Serverless Functions
│   ├── _lib/
│   │   ├── prisma.ts         # Prisma client singleton
│   │   └── validators.ts     # Zod validation schemas
│   └── health.ts             # API health check endpoint (/api/health)
├── prisma/
│   ├── migrations/           # Versioned SQL migrations
│   ├── schema.prisma         # Prisma data schema
│   └── seed.ts               # Seed data for demo farm
├── src/
│   ├── components/           # UI Components (Header, PondCard, QuickActions, ฯลฯ)
│   ├── lib/                  # Utilities (finance calculations, date formatting, mockData)
│   ├── types/                # Domain TypeScript types
│   ├── App.tsx               # Main application container
│   ├── main.tsx              # React entry point
│   └── index.css             # Tailwind CSS tokens & styling
├── tests/                    # Vitest unit test suite
├── .env.example              # ตัวอย่างการตั้งค่า Environment Variables
├── vercel.json               # การตั้งค่าสำหรับ Deploy บน Vercel
└── README.md
```

---

## 7. กฎความปลอดภัยและความเป็นส่วนตัว (Security & Privacy)

- **ห้ามใส่ Secret ใน Client:** รหัสผ่าน ฐานข้อมูล และ API keys ใดๆ ต้องอยู่เฉพาะใน Environment Variables ฝั่งเซิร์ฟเวอร์
- **ตรวจสอบสิทธิ์ก่อนบันทึก:** ในขั้นตอนต่อๆ ไป การบันทึกและแก้ไขข้อมูลฟาร์มจะต้องตรวจสอบ Farm ID และสิทธิ์ของผู้ใช้เสมอ
- **ความถูกต้องของข้อมูล:** ไม่มีฟังก์ชันการกุเรื่องหรือแสร้งจำลองข้อมูลภายนอก ข้อมูลสภาพน้ำและสิ่งแวดล้อมมาจากการบันทึกจริงของเกษตรกรเท่านั้น
