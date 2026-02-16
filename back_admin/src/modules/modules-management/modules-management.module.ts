import { Module } from '@nestjs/common';
import { ModulesManagementService } from './modules-management.service';
import { GlobalModulesController } from './controllers/global-modules.controller';
import { CompanyModulesController } from './controllers/company-modules.controller';
import { UserPermissionsController } from './controllers/user-permissions.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    GlobalModulesController,
    CompanyModulesController,
    UserPermissionsController,
  ],
  providers: [ModulesManagementService],
  exports: [ModulesManagementService],
})
export class ModulesManagementModule {}
