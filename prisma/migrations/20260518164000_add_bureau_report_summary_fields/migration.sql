ALTER TABLE `client_bureau_reports`
  ADD COLUMN `dateGenerated` DATETIME(3) NULL,
  ADD COLUMN `accountSummary` JSON NULL,
  ADD COLUMN `creditUsage` JSON NULL,
  ADD COLUMN `debtSummary` JSON NULL,
  ADD COLUMN `reportOriginalName` VARCHAR(255) NULL,
  ADD COLUMN `reportParsedAt` DATETIME(3) NULL,
  ADD COLUMN `reportParseStatus` VARCHAR(32) NULL,
  ADD COLUMN `reportParseError` TEXT NULL;
