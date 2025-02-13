-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'SOLD', 'RESERVED', 'EXPIRED', 'DELETED');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE';
