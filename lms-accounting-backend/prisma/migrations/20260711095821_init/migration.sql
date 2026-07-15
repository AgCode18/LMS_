-- CreateTable
CREATE TABLE `Branch` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Branch_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `contactNumber` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoanApplication` (
    `id` VARCHAR(191) NOT NULL,
    `loanNumber` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `requestedAmount` DOUBLE NOT NULL,
    `approvedAmount` DOUBLE NULL,
    `processingFees` DOUBLE NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'APPLICATION_STARTED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `kycId` VARCHAR(191) NULL,

    UNIQUE INDEX `LoanApplication_loanNumber_key`(`loanNumber`),
    UNIQUE INDEX `LoanApplication_kycId_key`(`kycId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Kyc` (
    `id` VARCHAR(191) NOT NULL,
    `status` ENUM('NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `remarks` VARCHAR(191) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sanction` (
    `id` VARCHAR(191) NOT NULL,
    `loanApplicationNumber` VARCHAR(191) NOT NULL,
    `sanctionedAmount` DOUBLE NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'PARTIAL') NOT NULL DEFAULT 'PENDING',
    `approvedAt` DATETIME(3) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Sanction_loanApplicationNumber_idx`(`loanApplicationNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NachMandate` (
    `id` VARCHAR(191) NOT NULL,
    `loanApplicationId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `maxDebitAmount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `NachMandate_loanApplicationId_idx`(`loanApplicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoanEmiSchedule` (
    `id` VARCHAR(191) NOT NULL,
    `loanApplicationId` VARCHAR(191) NOT NULL,
    `emiNo` INTEGER NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `emiAmount` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',

    INDEX `LoanEmiSchedule_loanApplicationId_emiNo_idx`(`loanApplicationId`, `emiNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmiPayment` (
    `id` VARCHAR(191) NOT NULL,
    `emiScheduleId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `principalPaid` DOUBLE NOT NULL DEFAULT 0,
    `interestPaid` DOUBLE NOT NULL DEFAULT 0,
    `penaltyPaid` DOUBLE NOT NULL DEFAULT 0,
    `bouncePaid` DOUBLE NOT NULL DEFAULT 0,
    `excessAmount` DOUBLE NOT NULL DEFAULT 0,
    `paymentDate` DATETIME(3) NOT NULL,
    `paymentMode` VARCHAR(191) NOT NULL,
    `transactionReference` VARCHAR(191) NULL,
    `journalEntryId` VARCHAR(191) NULL,
    `accountingStatus` ENUM('PENDING', 'JOURNAL_CREATED', 'POSTED') NOT NULL DEFAULT 'PENDING',
    `processedById` VARCHAR(191) NULL,
    `branchId` VARCHAR(191) NULL,
    `remarks` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoanDisbursement` (
    `id` VARCHAR(191) NOT NULL,
    `loanApplicationId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `principalAmount` DOUBLE NOT NULL,
    `interestAmount` DOUBLE NOT NULL DEFAULT 0,
    `chargesAmount` DOUBLE NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `disbursementMode` VARCHAR(191) NOT NULL,
    `disbursementStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `disbursementDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `transactionReference` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NULL,
    `bankAccountNumber` VARCHAR(191) NULL,
    `ifscCode` VARCHAR(191) NULL,
    `accountHolderName` VARCHAR(191) NULL,
    `processedBy` VARCHAR(191) NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `remarks` VARCHAR(191) NULL,
    `accountingStatus` ENUM('PENDING', 'JOURNAL_CREATED', 'POSTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LoanDisbursement_transactionReference_key`(`transactionReference`),
    INDEX `LoanDisbursement_loanApplicationId_idx`(`loanApplicationId`),
    INDEX `LoanDisbursement_transactionReference_idx`(`transactionReference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoanRecovery` (
    `id` VARCHAR(191) NOT NULL,
    `loanApplicationId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `totalOutstandingAmount` DOUBLE NOT NULL,
    `recoveredAmount` DOUBLE NOT NULL,
    `balanceAmount` DOUBLE NOT NULL,
    `settlementAmount` DOUBLE NULL,
    `settlementDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecoveryPayment` (
    `id` VARCHAR(191) NOT NULL,
    `loanRecoveryId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `paymentDate` DATETIME(3) NOT NULL,
    `paymentMode` VARCHAR(191) NOT NULL,
    `referenceNo` VARCHAR(191) NULL,
    `accountingStatus` ENUM('PENDING', 'JOURNAL_CREATED', 'POSTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `foreClosure` (
    `id` VARCHAR(191) NOT NULL,
    `loanApplicationId` VARCHAR(191) NOT NULL,
    `principalOutstanding` DOUBLE NULL,
    `interestAccrued` DOUBLE NULL,
    `penalty` DOUBLE NULL,
    `totalPayable` DOUBLE NULL,
    `settledAmount` DOUBLE NULL,
    `settledAt` DATETIME(3) NULL,
    `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `accountingStatus` ENUM('PENDING', 'JOURNAL_CREATED', 'POSTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('ASSET', 'LIABILITY', 'INCOME', 'EXPENSE', 'EQUITY') NOT NULL,
    `systemKey` VARCHAR(191) NULL,
    `parentAccountId` VARCHAR(191) NULL,
    `openingBalance` DOUBLE NOT NULL DEFAULT 0,
    `currentBalance` DOUBLE NOT NULL DEFAULT 0,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `accounts_code_key`(`code`),
    UNIQUE INDEX `accounts_systemKey_key`(`systemKey`),
    INDEX `accounts_type_idx`(`type`),
    INDEX `accounts_status_idx`(`status`),
    INDEX `accounts_parentAccountId_idx`(`parentAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VoucherCounter` (
    `year` INTEGER NOT NULL,
    `sequence` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`year`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JournalEntry` (
    `id` VARCHAR(191) NOT NULL,
    `voucherNo` VARCHAR(191) NOT NULL,
    `voucherType` ENUM('JOURNAL', 'RECEIPT', 'PAYMENT', 'CONTRA') NOT NULL DEFAULT 'JOURNAL',
    `transactionDate` DATETIME(3) NOT NULL,
    `referenceType` ENUM('LOAN_DISBURSEMENT', 'EMI_PAYMENT', 'RECOVERY', 'FORECLOSURE', 'PROCESSING_FEE', 'PARTNER_COMMISSION', 'PENALTY', 'WRITE_OFF', 'REFUND', 'MANUAL') NULL,
    `referenceId` VARCHAR(191) NULL,
    `narration` VARCHAR(191) NULL,
    `totalDebit` DOUBLE NOT NULL,
    `totalCredit` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `status` ENUM('DRAFT', 'POSTED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `postedAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NULL,
    `approvedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `loanDisbursementId` VARCHAR(191) NULL,

    UNIQUE INDEX `JournalEntry_voucherNo_key`(`voucherNo`),
    INDEX `JournalEntry_voucherNo_idx`(`voucherNo`),
    INDEX `JournalEntry_transactionDate_idx`(`transactionDate`),
    INDEX `JournalEntry_status_idx`(`status`),
    INDEX `JournalEntry_referenceType_idx`(`referenceType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JournalEntryLine` (
    `id` VARCHAR(191) NOT NULL,
    `journalEntryId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `debit` DOUBLE NOT NULL DEFAULT 0,
    `credit` DOUBLE NOT NULL DEFAULT 0,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isCleared` BOOLEAN NOT NULL DEFAULT false,
    `clearedDate` DATETIME(3) NULL,

    INDEX `JournalEntryLine_journalEntryId_idx`(`journalEntryId`),
    INDEX `JournalEntryLine_accountId_idx`(`accountId`),
    INDEX `JournalEntryLine_accountId_isCleared_idx`(`accountId`, `isCleared`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LoanApplication` ADD CONSTRAINT `LoanApplication_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanApplication` ADD CONSTRAINT `LoanApplication_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanApplication` ADD CONSTRAINT `LoanApplication_kycId_fkey` FOREIGN KEY (`kycId`) REFERENCES `Kyc`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sanction` ADD CONSTRAINT `Sanction_loanApplicationNumber_fkey` FOREIGN KEY (`loanApplicationNumber`) REFERENCES `LoanApplication`(`loanNumber`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NachMandate` ADD CONSTRAINT `NachMandate_loanApplicationId_fkey` FOREIGN KEY (`loanApplicationId`) REFERENCES `LoanApplication`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanEmiSchedule` ADD CONSTRAINT `LoanEmiSchedule_loanApplicationId_fkey` FOREIGN KEY (`loanApplicationId`) REFERENCES `LoanApplication`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmiPayment` ADD CONSTRAINT `EmiPayment_emiScheduleId_fkey` FOREIGN KEY (`emiScheduleId`) REFERENCES `LoanEmiSchedule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanDisbursement` ADD CONSTRAINT `LoanDisbursement_loanApplicationId_fkey` FOREIGN KEY (`loanApplicationId`) REFERENCES `LoanApplication`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanDisbursement` ADD CONSTRAINT `LoanDisbursement_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanRecovery` ADD CONSTRAINT `LoanRecovery_loanApplicationId_fkey` FOREIGN KEY (`loanApplicationId`) REFERENCES `LoanApplication`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanRecovery` ADD CONSTRAINT `LoanRecovery_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecoveryPayment` ADD CONSTRAINT `RecoveryPayment_loanRecoveryId_fkey` FOREIGN KEY (`loanRecoveryId`) REFERENCES `LoanRecovery`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `foreClosure` ADD CONSTRAINT `foreClosure_loanApplicationId_fkey` FOREIGN KEY (`loanApplicationId`) REFERENCES `LoanApplication`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_parentAccountId_fkey` FOREIGN KEY (`parentAccountId`) REFERENCES `accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JournalEntry` ADD CONSTRAINT `JournalEntry_loanDisbursementId_fkey` FOREIGN KEY (`loanDisbursementId`) REFERENCES `LoanDisbursement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JournalEntryLine` ADD CONSTRAINT `JournalEntryLine_journalEntryId_fkey` FOREIGN KEY (`journalEntryId`) REFERENCES `JournalEntry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JournalEntryLine` ADD CONSTRAINT `JournalEntryLine_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
