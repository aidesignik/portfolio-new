-- CreateEnum
CREATE TYPE "DriverColor" AS ENUM ('lavender', 'periwinkle', 'sky', 'teal', 'mint', 'sage', 'butter', 'peach', 'rose', 'orchid');

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "avatarColor" "DriverColor";
