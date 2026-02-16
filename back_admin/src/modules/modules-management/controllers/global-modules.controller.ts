import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { ModulesManagementService } from '../modules-management.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums';
import { ApiResponseDto } from '../../../common/dto';
import { ModuleResponseDto } from '../dto';

@Controller('modules/global')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GlobalModulesController {
  constructor(
    private readonly modulesManagementService: ModulesManagementService,
  ) {}

  @Get()
  @Roles(Role.MASTER)
  async findAllModules(): Promise<ApiResponseDto<ModuleResponseDto[]>> {
    const modules = await this.modulesManagementService.findAllModules();
    return {
      success: true,
      data: modules,
      message: 'Módulos globais listados com sucesso',
    };
  }

  @Get(':moduleId')
  @Roles(Role.MASTER)
  async findModuleById(
    @Param('moduleId') moduleId: string,
  ): Promise<ApiResponseDto<ModuleResponseDto>> {
    const module = await this.modulesManagementService.findModuleById(moduleId);
    return {
      success: true,
      data: module,
      message: 'Módulo encontrado com sucesso',
    };
  }
}
