/*
  Warnings:

  - You are about to drop the column `shareCount` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the `Comparison` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ViewHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Comparison" DROP CONSTRAINT "Comparison_listingId_fkey";

-- DropForeignKey
ALTER TABLE "Comparison" DROP CONSTRAINT "Comparison_userId_fkey";

-- DropForeignKey
ALTER TABLE "ViewHistory" DROP CONSTRAINT "ViewHistory_listingId_fkey";

-- DropForeignKey
ALTER TABLE "ViewHistory" DROP CONSTRAINT "ViewHistory_userId_fkey";

-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "shareCount";

-- DropTable
DROP TABLE "Comparison";

-- DropTable
DROP TABLE "ViewHistory";
