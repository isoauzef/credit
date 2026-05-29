CREATE TABLE `api_vendors` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(160) NOT NULL,
  `contactEmail` VARCHAR(255) NULL,
  `keyHash` VARCHAR(64) NOT NULL,
  `keyPreview` VARCHAR(32) NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `notes` TEXT NULL,
  `lastUsedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `api_vendors_keyHash_key`(`keyHash`),
  INDEX `api_vendors_active_sortOrder_idx`(`active`, `sortOrder`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `contact_submissions`
  ADD COLUMN `assignedVendorId` INTEGER NULL,
  ADD COLUMN `vendorAssignedAt` DATETIME(3) NULL,
  ADD COLUMN `vendorDeliveredAt` DATETIME(3) NULL;

CREATE INDEX `contact_submissions_assignedVendorId_vendorDeliveredAt_idx`
  ON `contact_submissions`(`assignedVendorId`, `vendorDeliveredAt`);

ALTER TABLE `contact_submissions`
  ADD CONSTRAINT `contact_submissions_assignedVendorId_fkey`
  FOREIGN KEY (`assignedVendorId`) REFERENCES `api_vendors`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
