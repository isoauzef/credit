-- Client dashboard accounts, bureau score summaries, document uploads, and worker updates.

CREATE TABLE `client_dashboard_accounts` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `checkoutSubmissionId` INTEGER NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `passwordHash` VARCHAR(255) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'active',
  `lastLoginAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `client_dashboard_accounts_checkoutSubmissionId_key`(`checkoutSubmissionId`),
  INDEX `client_dashboard_accounts_email_idx`(`email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `client_bureau_reports` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `accountId` INTEGER NOT NULL,
  `bureau` VARCHAR(32) NOT NULL,
  `score` INTEGER NOT NULL DEFAULT 0,
  `scoreDate` DATETIME(3) NULL,
  `negativeItems` INTEGER NOT NULL DEFAULT 0,
  `disputes` INTEGER NOT NULL DEFAULT 0,
  `deletions` INTEGER NOT NULL DEFAULT 0,
  `positivesNote` TEXT NULL,
  `reportDocPath` VARCHAR(500) NULL,
  `reportUploadedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `client_bureau_reports_accountId_bureau_key`(`accountId`, `bureau`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `client_dashboard_documents` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `accountId` INTEGER NOT NULL,
  `type` VARCHAR(64) NOT NULL,
  `label` VARCHAR(128) NOT NULL,
  `token` VARCHAR(500) NOT NULL,
  `originalName` VARCHAR(255) NULL,
  `mimeType` VARCHAR(100) NULL,
  `size` INTEGER NULL,
  `uploadedBy` VARCHAR(32) NOT NULL DEFAULT 'client',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `client_dashboard_documents_accountId_type_idx`(`accountId`, `type`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `client_dashboard_updates` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `accountId` INTEGER NOT NULL,
  `title` VARCHAR(160) NOT NULL,
  `body` TEXT NOT NULL,
  `createdBy` VARCHAR(128) NOT NULL DEFAULT 'Zack',
  `disputes` INTEGER NULL,
  `deletions` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `client_dashboard_updates_accountId_createdAt_idx`(`accountId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `client_dashboard_accounts`
  ADD CONSTRAINT `client_dashboard_accounts_checkoutSubmissionId_fkey`
  FOREIGN KEY (`checkoutSubmissionId`) REFERENCES `checkout_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `client_bureau_reports`
  ADD CONSTRAINT `client_bureau_reports_accountId_fkey`
  FOREIGN KEY (`accountId`) REFERENCES `client_dashboard_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `client_dashboard_documents`
  ADD CONSTRAINT `client_dashboard_documents_accountId_fkey`
  FOREIGN KEY (`accountId`) REFERENCES `client_dashboard_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `client_dashboard_updates`
  ADD CONSTRAINT `client_dashboard_updates_accountId_fkey`
  FOREIGN KEY (`accountId`) REFERENCES `client_dashboard_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
