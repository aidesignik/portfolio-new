-- AlterTable
ALTER TABLE "Carrier" ALTER COLUMN "contactPhone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "image" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;
