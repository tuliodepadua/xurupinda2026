import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';
import {
  PaginationDto,
  PaginatedResponseDto,
  ApiResponseDto,
} from '../../common/dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Criar novo usuário
   * - MASTER pode criar qualquer usuário
   * - ADMIN pode criar MANAGER e CLIENT
   */
  @Post()
  @Roles(Role.MASTER, Role.ADMIN)
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser('id') currentUserId: string,
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const data = await this.usersService.create(createUserDto, currentUserId);
    return new ApiResponseDto('Usuário criado com sucesso', data);
  }

  /**
   * Listar usuários com paginação e filtro automático por tenant
   * - MASTER vê todos
   * - ADMIN/MANAGER veem apenas da sua empresa
   * - CLIENT vê apenas seu perfil
   */
  @Get()
  @Roles(Role.MASTER, Role.ADMIN, Role.MANAGER, Role.CLIENT)
  async findAll(
    @Query() paginationDto: PaginationDto,
    @CurrentUser('id') currentUserId: string,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    return this.usersService.findAll(paginationDto, currentUserId);
  }

  /**
   * Buscar usuário por ID
   */
  @Get(':id')
  @Roles(Role.MASTER, Role.ADMIN, Role.MANAGER, Role.CLIENT)
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const data = await this.usersService.findOne(id, currentUserId);
    return new ApiResponseDto('Usuário encontrado', data);
  }

  /**
   * Atualizar usuário
   * - MASTER pode atualizar qualquer usuário
   * - ADMIN pode atualizar MANAGER e CLIENT da sua empresa
   * - MANAGER e CLIENT podem atualizar apenas seu próprio perfil
   */
  @Patch(':id')
  @Roles(Role.MASTER, Role.ADMIN, Role.MANAGER, Role.CLIENT)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('id') currentUserId: string,
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const data = await this.usersService.update(
      id,
      updateUserDto,
      currentUserId,
    );
    return new ApiResponseDto('Usuário atualizado com sucesso', data);
  }

  /**
   * Deletar usuário (soft-delete)
   * - MASTER pode deletar qualquer usuário
   * - ADMIN pode deletar MANAGER e CLIENT da sua empresa
   */
  @Delete(':id')
  @Roles(Role.MASTER, Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<void> {
    await this.usersService.remove(id, currentUserId);
  }

  /**
   * Restaurar usuário deletado
   * - MASTER pode restaurar qualquer usuário
   * - ADMIN pode restaurar usuários da sua empresa
   */
  @Patch(':id/restore')
  @Roles(Role.MASTER, Role.ADMIN)
  async restore(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const data = await this.usersService.restore(id, currentUserId);
    return new ApiResponseDto('Usuário restaurado com sucesso', data);
  }
}
