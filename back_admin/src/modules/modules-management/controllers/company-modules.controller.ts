import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ModulesManagementService } from '../modules-management.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../common/enums';
import { ApiResponseDto } from '../../../common/dto';
import {
  EnableModuleForCompanyDto,
  UpdateCompanyModuleDto,
  CompanyModuleResponseDto,
} from '../dto';

@Controller('modules/companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyModulesController {
  constructor(
    private readonly modulesManagementService: ModulesManagementService,
  ) {}

  @Post(':companyId/enable')
  @Roles(Role.MASTER)
  async enableModuleForCompany(
    @Param('companyId') companyId: string,
    @Body() dto: EnableModuleForCompanyDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponseDto<CompanyModuleResponseDto>> {
    const module = await this.modulesManagementService.enableModuleForCompany(
      companyId,
      dto,
      userId,
    );
    return {
      success: true,
      data: module,
      message: 'Módulo habilitado para a empresa com sucesso',
    };
  }

  @Delete(':companyId/disable/:moduleId')
  @Roles(Role.MASTER)
  async disableModuleForCompany(
    @Param('companyId') companyId: string,
    @Param('moduleId') moduleId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponseDto<void>> {
    await this.modulesManagementService.disableModuleForCompany(
      companyId,
      moduleId,
      userId,
    );
    return {
      success: true,
      data: undefined,
      message: 'Módulo desabilitado para a empresa (cascata aplicada)',
    };
  }

  @Patch(':companyId/modules/:moduleId')
  @Roles(Role.MASTER)
  async updateCompanyModule(
    @Param('companyId') companyId: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: UpdateCompanyModuleDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponseDto<CompanyModuleResponseDto>> {
    const module = await this.modulesManagementService.updateCompanyModule(
      companyId,
      moduleId,
      dto,
      userId,
    );
    return {
      success: true,
      data: module,
      message: 'Módulo da empresa atualizado com sucesso',
    };
  }

  @Get(':companyId')
  @Roles(Role.MASTER, Role.ADMIN)
  async findCompanyModules(
    @Param('companyId') companyId: string,
    @CurrentUser() user: { id: string; role: Role; companyId: string },
  ): Promise<ApiResponseDto<CompanyModuleResponseDto[]>> {
    const modules = await this.modulesManagementService.findCompanyModules(
      companyId,
      user,
    );
    return {
      success: true,
      data: modules,
      message: 'Módulos da empresa listados com sucesso',
    };
  }
}
