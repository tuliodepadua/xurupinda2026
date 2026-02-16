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
  AssignPermissionDto,
  UpdatePermissionDto,
  UserPermissionResponseDto,
} from '../dto';

@Controller('modules/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserPermissionsController {
  constructor(
    private readonly modulesManagementService: ModulesManagementService,
  ) {}

  @Post(':userId/permissions')
  @Roles(Role.MASTER, Role.ADMIN)
  async assignPermissionToUser(
    @Param('userId') userId: string,
    @Body() dto: AssignPermissionDto,
    @CurrentUser() user: { id: string; role: Role; companyId: string },
  ): Promise<ApiResponseDto<UserPermissionResponseDto>> {
    const permission =
      await this.modulesManagementService.assignPermissionToUser(
        userId,
        dto,
        user,
      );
    return {
      success: true,
      data: permission,
      message: 'Permissão atribuída ao usuário com sucesso',
    };
  }

  @Get(':userId/permissions')
  @Roles(Role.MASTER, Role.ADMIN, Role.MANAGER)
  async findUserPermissions(
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string; role: Role; companyId: string },
  ): Promise<ApiResponseDto<UserPermissionResponseDto[]>> {
    const permissions = await this.modulesManagementService.findUserPermissions(
      userId,
      user,
    );
    return {
      success: true,
      data: permissions,
      message: 'Permissões do usuário listadas com sucesso',
    };
  }

  @Patch(':userId/permissions/:permissionId')
  @Roles(Role.MASTER, Role.ADMIN)
  async updateUserPermission(
    @Param('userId') userId: string,
    @Param('permissionId') permissionId: string,
    @Body() dto: UpdatePermissionDto,
    @CurrentUser() user: { id: string; role: Role; companyId: string },
  ): Promise<ApiResponseDto<UserPermissionResponseDto>> {
    const permission = await this.modulesManagementService.updateUserPermission(
      userId,
      permissionId,
      dto,
      user,
    );
    return {
      success: true,
      data: permission,
      message: 'Permissão do usuário atualizada com sucesso',
    };
  }

  @Delete(':userId/permissions/:permissionId')
  @Roles(Role.MASTER, Role.ADMIN)
  async removeUserPermission(
    @Param('userId') userId: string,
    @Param('permissionId') permissionId: string,
    @CurrentUser() user: { id: string; role: Role; companyId: string },
  ): Promise<ApiResponseDto<void>> {
    await this.modulesManagementService.removeUserPermission(
      userId,
      permissionId,
      user,
    );
    return {
      success: true,
      data: undefined,
      message: 'Permissão do usuário removida com sucesso',
    };
  }
}
