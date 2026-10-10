-- AlterTable
ALTER TABLE "farms" ADD COLUMN     "district" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "province" TEXT DEFAULT 'สมุทรสงคราม',
ADD COLUMN     "subdistrict" TEXT,
ADD COLUMN     "tidalInfluence" TEXT DEFAULT 'DIRECT',
ADD COLUMN     "waterPathNotes" TEXT,
ADD COLUMN     "waterSourceCanal" TEXT;

-- CreateTable
CREATE TABLE "reference_stations" (
    "id" TEXT NOT NULL,
    "farmId" TEXT,
    "provider" TEXT NOT NULL,
    "providerStationId" TEXT,
    "name" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "parameters" TEXT,
    "units" TEXT,
    "relevanceNotes" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'CANDIDATE',
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environmental_readings" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'VALID',
    "sourceRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "environmental_readings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reference_stations_farmId_idx" ON "reference_stations"("farmId");

-- CreateIndex
CREATE INDEX "reference_stations_provider_verificationStatus_idx" ON "reference_stations"("provider", "verificationStatus");

-- CreateIndex
CREATE INDEX "environmental_readings_stationId_observedAt_idx" ON "environmental_readings"("stationId", "observedAt");

-- CreateIndex
CREATE INDEX "environmental_readings_stationId_parameter_idx" ON "environmental_readings"("stationId", "parameter");

-- AddForeignKey
ALTER TABLE "reference_stations" ADD CONSTRAINT "reference_stations_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environmental_readings" ADD CONSTRAINT "environmental_readings_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "reference_stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
