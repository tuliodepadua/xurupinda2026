import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';
import { Role } from '../../common/enums';
import * as bcrypt from 'bcrypt';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo usuário com validação hierárquica
   * - MASTER pode criar qualquer tipo de usuário e escolher a empresa
   * - ADMIN pode criar apenas MANAGER e CLIENT da sua própria empresa
   * - MANAGER e CLIENT não podem criar usuários
   */
  async create(
    createUserDto: CreateUserDto,
    currentUserId: string,
  ): Promise<UserResponseDto> {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new NotFoundException('Usuário atual não encontrado');
    }

    // Validar email único
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email já cadastrado');
    }

    // Validação hierárquica
    this.validateUserCreation(currentUser.role as Role, createUserDto.role);

    // Determinar companyId
    let companyId: string | null;

    if ((currentUser.role as Role) === Role.MASTER) {
      // Master pode especificar qualquer empresa ou criar sem empresa (para outros Masters)
      if (createUserDto.role === Role.MASTER) {
        // Masters não precisam de companyId, mas vamos usar o primeiro disponível
        const firstCompany = await this.prisma.company.findFirst({
          where: { deletedAt: null },
        });

        if (!firstCompany) {
          throw new BadRequestException(
            'Nenhuma empresa disponível para vincular o usuário',
          );
        }

        companyId = firstCompany.id;
      } else {
        // Para outros roles, companyId é obrigatório
        if (!createUserDto.companyId) {
          throw new BadRequestException(
            'companyId é obrigatório para criar usuários que não sejam MASTER',
          );
        }

        // Validar se empresa existe
        const company = await this.prisma.company.findFirst({
          where: { id: createUserDto.companyId, deletedAt: null },
        });

        if (!company) {
          throw new NotFoundException('Empresa não encontrada');
        }

        companyId = createUserDto.companyId;
      }
    } else if ((currentUser.role as Role) === Role.ADMIN) {
      // Admin só pode criar usuários da sua própria empresa
      companyId = currentUser.companyId ?? null;

      // Se companyId foi fornecido, deve ser igual ao do Admin
      if (createUserDto.companyId && createUserDto.companyId !== companyId) {
        throw new ForbiddenException(
          'Você só pode criar usuários da sua própria empresa',
        );
      }
    } else {
      throw new ForbiddenException(
        'Você não tem permissão para criar usuários',
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Criar usuário
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        name: createUserDto.name,
        role: createUserDto.role,
        companyId: companyId ?? undefined,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return new UserResponseDto({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      companyId: user.companyId ?? undefined,
      company: user.company ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  /**
   * Lista usuários com paginação e filtro automático por tenant
   * - MASTER vê todos os usuários
   * - ADMIN vê apenas usuários da sua empresa
   * - MANAGER vê apenas usuários da sua empresa
   * - CLIENT vê apenas seu próprio perfil
   */
  async findAll(
    paginationDto: PaginationDto,
    currentUserId: string,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new NotFoundException('Usuário atual não encontrado');
    }

    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Filtro baseado no role
    const where: { deletedAt: null; id?: string; companyId?: string | null } = {
      deletedAt: null,
    };

    if ((currentUser.role as Role) === Role.CLIENT) {
      // Client vê apenas seu próprio perfil
      where.id = currentUser.id;
    } else if (
      (currentUser.role as Role) === Role.ADMIN ||
      (currentUser.role as Role) === Role.MANAGER
    ) {
      // Admin e Manager veem apenas usuários da sua empresa
      where.companyId = currentUser.companyId;
    }
    // Master não tem filtro adicional (vê todos)

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = users.map(
      (user) =>
        new UserResponseDto({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role,
          companyId: user.companyId ?? undefined,
          company: user.company ?? undefined,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }),
    );

    return new PaginatedResponseDto(data, total, page, limit);
  }

  /**
   * Busca um usuário por ID com validação de acesso
   */
  async findOne(id: string, currentUserId: string): Promise<UserResponseDto> {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new NotFoundException('Usuário atual não encontrado');
    }

    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Validar acesso
    this.validateUserAccess(currentUser, user);

    return new UserResponseDto({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      companyId: user.companyId ?? undefined,
      company: user.company ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  /**
   * Atualiza um usuário com validação de permissões
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserId: string,
  ): Promise<UserResponseDto> {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new NotFoundException('Usuário atual não encontrado');
    }

    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Validar acesso
    this.validateUserAccess(currentUser, user);

    // Validar mudança de role
    if (updateUserDto.role && updateUserDto.role !== (user.role as Role)) {
      this.validateRoleChange(
        currentUser.role as Role,
        user.role as Role,
        updateUserDto.role,
      );
    }

    // Validar email único
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new BadRequestException('Email já cadastrado');
      }
    }

    // Hash da senha se fornecida
    const dataToUpdate: Partial<UpdateUserDto> & { password?: string } = {
      ...updateUserDto,
    };
    if (updateUserDto.password) {
      dataToUpdate.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return new UserResponseDto({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role as Role,
      companyId: updatedUser.companyId ?? undefined,
      company: updatedUser.company ?? undefined,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    });
  }

  /**
   * Remove um usuário (soft-delete)
   */
  async remove(id: string, currentUserId: string): Promise<void> {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new NotFoundException('Usuário atual não encontrado');
    }

    // Não pode deletar a si mesmo
    if (id === currentUserId) {
      throw new BadRequestException(
        'Você não pode deletar seu próprio usuário',
      );
    }

    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Validar acesso
    this.validateUserAccess(currentUser, user);

    // Validar se pode deletar
    this.validateUserDeletion(currentUser.role as Role, user.role as Role);

    // Soft-delete
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restaura um usuário deletado
   */
  async restore(id: string, currentUserId: string): Promise<UserResponseDto> {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new NotFoundException('Usuário atual não encontrado');
    }

    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!user) {
      throw new NotFoundException('Usuário deletado não encontrado');
    }

    // Validar acesso (Masters podem restaurar qualquer usuário, Admins apenas da sua empresa)
    if (
      (currentUser.role as Role) !== Role.MASTER &&
      user.companyId !== currentUser.companyId
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para restaurar este usuário',
      );
    }

    // Validar se email ainda está disponível
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: user.email,
        deletedAt: null,
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        'Email já está em uso. Não é possível restaurar o usuário.',
      );
    }

    const restoredUser = await this.prisma.user.update({
      where: { id },
      data: { deletedAt: null },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return new UserResponseDto({
      id: restoredUser.id,
      email: restoredUser.email,
      name: restoredUser.name,
      role: restoredUser.role as Role,
      companyId: restoredUser.companyId ?? undefined,
      company: restoredUser.company ?? undefined,
      createdAt: restoredUser.createdAt,
      updatedAt: restoredUser.updatedAt,
    });
  }

  // ==================== Métodos de Validação ====================

  /**
   * Valida se o usuário atual pode criar um usuário com o role especificado
   */
  private validateUserCreation(currentRole: Role, targetRole: Role): void {
    if (currentRole === Role.MASTER) {
      // Master pode criar qualquer tipo de usuário
      return;
    }

    if (currentRole === Role.ADMIN) {
      // Admin pode criar apenas MANAGER e CLIENT
      if (targetRole !== Role.MANAGER && targetRole !== Role.CLIENT) {
        throw new ForbiddenException(
          'Admins só podem criar usuários do tipo MANAGER ou CLIENT',
        );
      }
      return;
    }

    // MANAGER e CLIENT não podem criar usuários
    throw new ForbiddenException('Você não tem permissão para criar usuários');
  }

  /**
   * Valida se o usuário atual pode acessar/modificar o usuário alvo
   */
  private validateUserAccess(
    currentUser: { id: string; role: Role | string; companyId: string | null },
    targetUser: { id: string; role: Role | string; companyId: string | null },
  ): void {
    // Master tem acesso a todos
    if ((currentUser.role as Role) === Role.MASTER) {
      return;
    }

    // Admin e Manager podem acessar apenas usuários da mesma empresa
    if (
      (currentUser.role as Role) === Role.ADMIN ||
      (currentUser.role as Role) === Role.MANAGER
    ) {
      if (currentUser.companyId !== targetUser.companyId) {
        throw new ForbiddenException(
          'Você não tem permissão para acessar este usuário',
        );
      }
      return;
    }

    // Client só pode acessar a si mesmo
    if ((currentUser.role as Role) === Role.CLIENT) {
      if (currentUser.id !== targetUser.id) {
        throw new ForbiddenException(
          'Você não tem permissão para acessar este usuário',
        );
      }
      return;
    }
  }

  /**
   * Valida mudança de role
   */
  private validateRoleChange(
    currentRole: Role,
    oldRole: Role,
    newRole: Role,
  ): void {
    // Master pode mudar qualquer role
    if (currentRole === Role.MASTER) {
      return;
    }

    // Admin pode mudar roles apenas de MANAGER e CLIENT
    if (currentRole === Role.ADMIN) {
      if (
        (oldRole !== Role.MANAGER && oldRole !== Role.CLIENT) ||
        (newRole !== Role.MANAGER && newRole !== Role.CLIENT)
      ) {
        throw new ForbiddenException(
          'Admins só podem alterar roles entre MANAGER e CLIENT',
        );
      }
      return;
    }

    // Outros roles não podem mudar roles
    throw new ForbiddenException('Você não tem permissão para alterar roles');
  }

  /**
   * Valida se pode deletar um usuário
   */
  private validateUserDeletion(currentRole: Role, targetRole: Role): void {
    // Master pode deletar qualquer usuário
    if (currentRole === Role.MASTER) {
      return;
    }

    // Admin pode deletar apenas MANAGER e CLIENT
    if (currentRole === Role.ADMIN) {
      if (targetRole !== Role.MANAGER && targetRole !== Role.CLIENT) {
        throw new ForbiddenException(
          'Admins só podem deletar usuários do tipo MANAGER ou CLIENT',
        );
      }
      return;
    }

    // Outros roles não podem deletar usuários
    throw new ForbiddenException(
      'Você não tem permissão para deletar usuários',
    );
  }
}
