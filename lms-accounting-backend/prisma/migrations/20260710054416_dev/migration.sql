-- AlterTable
ALTER TABLE `journalentryline` ADD COLUMN `clearedDate` DATETIME(3) NULL,
    ADD COLUMN `isCleared` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `JournalEntryLine_accountId_isCleared_idx` ON `JournalEntryLine`(`accountId`, `isCleared`);
