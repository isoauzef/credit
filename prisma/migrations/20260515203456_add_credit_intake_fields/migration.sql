-- AlterTable
ALTER TABLE `checkout_submissions` ADD COLUMN `address` VARCHAR(500) NULL,
    ADD COLUMN `authLetterSnapshot` TEXT NULL,
    ADD COLUMN `dob` VARCHAR(20) NULL,
    ADD COLUMN `idDocPath` VARCHAR(500) NULL,
    ADD COLUMN `signatureDataUrl` LONGTEXT NULL,
    ADD COLUMN `signedAt` DATETIME(3) NULL,
    ADD COLUMN `ssnEncrypted` TEXT NULL,
    ADD COLUMN `ssnLast4` VARCHAR(4) NULL,
    ADD COLUMN `utilityDocPath` VARCHAR(500) NULL,
    MODIFY `companyName` VARCHAR(255) NULL,
    MODIFY `reviewLinks` JSON NULL;
