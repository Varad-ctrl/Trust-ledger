/*
  Warnings:

  - A unique constraint covering the columns `[upi_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ScheduledStatus" AS ENUM ('PENDING', 'EXECUTED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "StandingStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');

-- AlterTable
ALTER TABLE "accounts" ALTER COLUMN "currency" SET DEFAULT 'INR';

-- AlterTable
ALTER TABLE "beneficiaries" ADD COLUMN     "is_favourite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receiver_account_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "upi_id" TEXT;

-- CreateTable
CREATE TABLE "scheduled_transfers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sender_account_id" TEXT NOT NULL,
    "receiver_account_id" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "description" TEXT,
    "execute_at" TIMESTAMP(3) NOT NULL,
    "status" "ScheduledStatus" NOT NULL DEFAULT 'PENDING',
    "executed_at" TIMESTAMP(3),
    "transaction_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standing_instructions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sender_account_id" TEXT NOT NULL,
    "receiver_account_id" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "description" TEXT,
    "frequency" "Frequency" NOT NULL,
    "day_of_month" INTEGER,
    "next_run_at" TIMESTAMP(3) NOT NULL,
    "status" "StandingStatus" NOT NULL DEFAULT 'ACTIVE',
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standing_instructions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_transfers_status_execute_at_idx" ON "scheduled_transfers"("status", "execute_at");

-- CreateIndex
CREATE INDEX "scheduled_transfers_user_id_idx" ON "scheduled_transfers"("user_id");

-- CreateIndex
CREATE INDEX "standing_instructions_status_next_run_at_idx" ON "standing_instructions"("status", "next_run_at");

-- CreateIndex
CREATE INDEX "standing_instructions_user_id_idx" ON "standing_instructions"("user_id");

-- CreateIndex
CREATE INDEX "beneficiaries_receiver_account_id_idx" ON "beneficiaries"("receiver_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_upi_id_key" ON "users"("upi_id");

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_receiver_account_id_fkey" FOREIGN KEY ("receiver_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_transfers" ADD CONSTRAINT "scheduled_transfers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_transfers" ADD CONSTRAINT "scheduled_transfers_sender_account_id_fkey" FOREIGN KEY ("sender_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_transfers" ADD CONSTRAINT "scheduled_transfers_receiver_account_id_fkey" FOREIGN KEY ("receiver_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standing_instructions" ADD CONSTRAINT "standing_instructions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standing_instructions" ADD CONSTRAINT "standing_instructions_sender_account_id_fkey" FOREIGN KEY ("sender_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standing_instructions" ADD CONSTRAINT "standing_instructions_receiver_account_id_fkey" FOREIGN KEY ("receiver_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
