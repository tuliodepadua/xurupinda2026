/*
  Warnings:

  - You are about to drop the column `moduleType` on the `company_modules` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyId,moduleId]` on the table `company_modules` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `moduleId` to the `company_modules` table without a default value. This is not possible if the table is not empty.

*/

-- Criar tabela de módulos
CREATE TABLE "modules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "ModuleType" NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- Criar índices na tabela modules
CREATE UNIQUE INDEX "modules_name_key" ON "modules"("name");
CREATE UNIQUE INDEX "modules_slug_key" ON "modules"("slug");
CREATE UNIQUE INDEX "modules_type_key" ON "modules"("type");
CREATE INDEX "modules_type_idx" ON "modules"("type");
CREATE INDEX "modules_isActive_idx" ON "modules"("isActive");

-- Nota: Os módulos globais serão criados pelo seed (seed.ts)
-- Isso garante que os IDs sejam gerados como CUID conforme o padrão do projeto

-- Adicionar coluna temporária para moduleId
ALTER TABLE "company_modules" ADD COLUMN "moduleId" TEXT;

-- Migrar dados de moduleType para moduleId apenas se houver dados
UPDATE "company_modules" cm
SET "moduleId" = m.id
FROM "modules" m
WHERE m.type = cm."moduleType"
  AND cm."moduleId" IS NULL;

-- Se não houver módulos cadastrados, a coluna pode ficar NULL temporariamente
-- O seed irá criar os módulos e o desenvolvedor deverá atualizar as associações manualmente se necessário

-- Remover índices antigos
DROP INDEX IF EXISTS "company_modules_companyId_moduleType_key";
DROP INDEX IF EXISTS "company_modules_moduleType_idx";

-- Remover coluna moduleType
ALTER TABLE "company_modules" DROP COLUMN "moduleType";

-- Criar novos índices
CREATE INDEX "company_modules_moduleId_idx" ON "company_modules"("moduleId");
CREATE UNIQUE INDEX "company_modules_companyId_moduleId_key" ON "company_modules"("companyId", "moduleId");

-- Adicionar foreign key
ALTER TABLE "company_modules" ADD CONSTRAINT "company_modules_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;