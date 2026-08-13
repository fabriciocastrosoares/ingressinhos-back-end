/*
  Warnings:

  - Changed the type of `result` on the `ticket_validations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ValidationResult" AS ENUM ('VALID', 'INVALID', 'ALREADY_USED');

-- AlterTable
ALTER TABLE "ticket_validations" DROP COLUMN "result",
ADD COLUMN     "result" "ValidationResult" NOT NULL;
