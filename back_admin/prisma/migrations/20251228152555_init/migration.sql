-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MASTER', 'ADMIN', 'MANAGER', 'CLIENT');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('NONE', 'READ', 'WRITE', 'ADMIN');

-- CreateEnum
CREATE TYPE "ModuleType" AS ENUM ('FINANCIAL', 'INVENTORY', 'SALES', 'REPORTS', 'USER_MANAGEMENT', 'SETTINGS', 'SCHEDULES', 'IMAGES');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "companyId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_modules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "moduleType" "ModuleType" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultPermission" "Permission" NOT NULL DEFAULT 'NONE',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_module_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyModuleId" TEXT NOT NULL,
    "permission" "Permission" NOT NULL DEFAULT 'NONE',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_module_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE INDEX "companies_deletedAt_idx" ON "companies"("deletedAt");

-- CreateIndex
CREATE INDEX "companies_slug_idx" ON "companies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_companyId_idx" ON "users"("companyId");

-- CreateIndex
CREATE INDEX "users_email_deletedAt_idx" ON "users"("email", "deletedAt");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "company_modules_companyId_isEnabled_idx" ON "company_modules"("companyId", "isEnabled");

-- CreateIndex
CREATE INDEX "company_modules_moduleType_idx" ON "company_modules"("moduleType");

-- CreateIndex
CREATE INDEX "company_modules_deletedAt_idx" ON "company_modules"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "company_modules_companyId_moduleType_key" ON "company_modules"("companyId", "moduleType");

-- CreateIndex
CREATE INDEX "user_module_permissions_userId_idx" ON "user_module_permissions"("userId");

-- CreateIndex
CREATE INDEX "user_module_permissions_companyModuleId_idx" ON "user_module_permissions"("companyModuleId");

-- CreateIndex
CREATE INDEX "user_module_permissions_permission_idx" ON "user_module_permissions"("permission");

-- CreateIndex
CREATE INDEX "user_module_permissions_deletedAt_idx" ON "user_module_permissions"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_module_permissions_userId_companyModuleId_key" ON "user_module_permissions"("userId", "companyModuleId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_modules" ADD CONSTRAINT "company_modules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_module_permissions" ADD CONSTRAINT "user_module_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_module_permissions" ADD CONSTRAINT "user_module_permissions_companyModuleId_fkey" FOREIGN KEY ("companyModuleId") REFERENCES "company_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
