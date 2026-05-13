-- AlterTable
ALTER TABLE `checkout_submissions`
  ADD COLUMN `phone` VARCHAR(50) NULL,
  ADD COLUMN `stripeCustomerId` VARCHAR(255) NULL,
  ADD COLUMN `stripeSetupIntentId` VARCHAR(255) NULL,
  ADD COLUMN `stripePaymentMethodId` VARCHAR(255) NULL,
  ADD COLUMN `crmLeadId` INTEGER NULL;