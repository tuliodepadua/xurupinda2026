import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  EnableModuleForCompanyDto,
  UpdateCompanyModuleDto,
  AssignPermissionDto,
  UpdatePermissionDto,
  CompanyModuleResponseDto,
  UserPermissionResponseDto,
  ModuleResponseDto,
} from './dto';
import { ModuleType, Permission, Role } from '../../common/enums';

@Injectable()
export class ModulesManagementService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== MÓDULOS GLOBAIS ====================

  /**
   * Lista todos os módulos disponíveis no sistema.
   */
  async findAllModules(): Promise<ModuleResponseDto[]> {
    const modules = await this.prisma.module.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    return modules.map(
      (m) =>
        new ModuleResponseDto({
          ...m,
          type: m.type as ModuleType,
        }),
    );
  }

  /**
   * Busca um módulo por ID.
   */
  async findModuleById(moduleId: string): Promise<ModuleResponseDto> {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      throw new NotFoundException('Módulo não encontrado');
    }

    return new ModuleResponseDto({
      ...module,
      type: module.type as ModuleType,
    });
  }

  // ==================== MÓDULOS POR EMPRESA (Masters) ======================================

  /**
   * Habilita um módulo para uma empresa específica.
   * Apenas Masters podem executar esta ação.
   */
  async enableModuleForCompany(
    companyId: string,
    dto: EnableModuleForCompanyDto,
    requestingUserId: string,
  ): Promise<CompanyModuleResponseDto> {
    // Validar que a empresa existe
    const company = await this.prisma.company.findUnique({
      where: { id: companyId, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // Validar que o módulo existe
    const module = await this.prisma.module.findUnique({
      where: { id: dto.moduleId, isActive: true },
    });

    if (!module) {
      throw new NotFoundException('Módulo não encontrado');
    }

    // Verificar se o módulo já existe para esta empresa
    const existingModule = await this.prisma.companyModule.findUnique({
      where: {
        company_module_unique: {
          companyId,
          moduleId: dto.moduleId,
        },
      },
    });

    let companyModule;

    if (existingModule) {
      // Se existe mas está deletado, restaurar
      if (existingModule.deletedAt) {
        companyModule = await this.prisma.companyModule.update({
          where: { id: existingModule.id },
          data: {
            deletedAt: null,
            isEnabled: dto.isEnabled ?? true,
            defaultPermission: dto.defaultPermission ?? Permission.NONE,
          },
          include: {
            module: true,
          },
        });
      } else {
        // Se já existe e está ativo, apenas atualizar
        companyModule = await this.prisma.companyModule.update({
          where: { id: existingModule.id },
          data: {
            isEnabled: dto.isEnabled ?? true,
            defaultPermission: dto.defaultPermission ?? Permission.NONE,
          },
          include: {
            module: true,
          },
        });
      }
    } else {
      // Criar novo módulo para a empresa
      companyModule = await this.prisma.companyModule.create({
        data: {
          companyId,
          moduleId: dto.moduleId,
          isEnabled: dto.isEnabled ?? true,
          defaultPermission: dto.defaultPermission ?? Permission.NONE,
        },
        include: {
          module: true,
        },
      });
    }

    return new CompanyModuleResponseDto({
      ...companyModule,
      module: {
        ...companyModule.module,
        type: companyModule.module.type as ModuleType,
      },
      defaultPermission: companyModule.defaultPermission as Permission,
    });
  }

  /**
   * Desabilita um módulo para uma empresa.
   * Cascata: Remove todas as permissões dos usuários (soft-delete).
   */
  async disableModuleForCompany(
    companyId: string,
    moduleId: string,
    requestingUserId: string,
  ): Promise<void> {
    // Validar que a empresa existe
    const company = await this.prisma.company.findUnique({
      where: { id: companyId, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // Buscar o módulo da empresa
    const companyModule = await this.prisma.companyModule.findFirst({
      where: {
        companyId,
        moduleId,
        deletedAt: null,
      },
    });

    if (!companyModule) {
      throw new NotFoundException('Módulo não encontrado para esta empresa');
    }

    // Transação: Soft-delete do módulo e todas as permissões relacionadas
    await this.prisma.$transaction(async (tx) => {
      // Soft-delete de todas as permissões dos usuários relacionadas a este módulo
      await tx.userModulePermission.updateMany({
        where: {
          companyModuleId: companyModule.id,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
          permission: Permission.NONE,
        },
      });

      // Soft-delete do módulo da empresa
      await tx.companyModule.update({
        where: { id: companyModule.id },
        data: {
          deletedAt: new Date(),
          isEnabled: false,
        },
      });
    });
  }

  /**
   * Lista todos os módulos de uma empresa.
   * Masters veem todos; Admins veem apenas da sua empresa.
   */
  async findCompanyModules(
    companyId: string,
    requestingUser: { id: string; role: Role; companyId: string },
  ): Promise<CompanyModuleResponseDto[]> {
    // Validar acesso
    if (requestingUser.role !== Role.MASTER) {
      if (requestingUser.companyId !== companyId) {
        throw new ForbiddenException('Acesso negado a esta empresa');
      }
    }

    const modules = await this.prisma.companyModule.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      include: {
        module: true,
      },
      orderBy: {
        module: {
          order: 'asc',
        },
      },
    });

    return modules.map(
      (m) =>
        new CompanyModuleResponseDto({
          ...m,
          module: {
            ...m.module,
            type: m.module.type as ModuleType,
          },
          defaultPermission: m.defaultPermission as Permission,
        }),
    );
  }

  /**
   * Atualiza configurações de um módulo da empresa.
   */
  async updateCompanyModule(
    companyId: string,
    moduleId: string,
    dto: UpdateCompanyModuleDto,
    requestingUserId: string,
  ): Promise<CompanyModuleResponseDto> {
    console.log(`companyId: ${companyId} moduleId: ${moduleId}`);
    // Buscar o módulo
    const companyModule = await this.prisma.companyModule.findFirst({
      where: {
        moduleId,
        companyId,
        deletedAt: null,
      },
    });

    if (!companyModule) {
      throw new NotFoundException('Módulo não encontrado');
    }

    const companyModuleId = companyModule?.id;
    // Atualizar
    const updated = await this.prisma.companyModule.update({
      where: { id: companyModuleId },
      data: dto,
      include: {
        module: true,
      },
    });

    return new CompanyModuleResponseDto({
      ...updated,
      module: {
        ...updated.module,
        type: updated.module.type as ModuleType,
      },
      defaultPermission: updated.defaultPermission as Permission,
    });
  }

  /**
   * Lista todos os tipos de módulos disponíveis no sistema (deprecated - use findAllModules).
   */
  async listAllModuleTypes(): Promise<ModuleType[]> {
    return Object.values(ModuleType);
  }

  // ==================== PERMISSÕES DE USUÁRIOS (Admins) ====================

  /**
   * Atribui uma permissão a um usuário para um módulo específico.
   * Admins só podem atribuir para usuários da sua empresa.
   */
  async assignPermissionToUser(
    userId: string,
    dto: AssignPermissionDto,
    requestingUser: { id: string; role: Role; companyId: string },
  ): Promise<UserPermissionResponseDto> {
    // Buscar o usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Validar acesso (Admin só pode atribuir para sua empresa)
    if (requestingUser.role !== Role.MASTER) {
      if (user.companyId !== requestingUser.companyId) {
        throw new ForbiddenException(
          'Você não pode atribuir permissões para usuários de outra empresa',
        );
      }
    }

    // Validar que o módulo existe e está habilitado para a empresa do usuário
    const companyModule = await this.prisma.companyModule.findFirst({
      where: {
        id: dto.companyModuleId,
        companyId: user.companyId ?? undefined,
        deletedAt: null,
        isEnabled: true,
      },
      include: {
        module: true,
      },
    });

    if (!companyModule) {
      throw new BadRequestException(
        'Módulo não está disponível para a empresa do usuário',
      );
    }

    // Verificar se já existe uma permissão para este usuário/módulo
    const existingPermission =
      await this.prisma.userModulePermission.findUnique({
        where: {
          user_module_permission_unique: {
            userId,
            companyModuleId: dto.companyModuleId,
          },
        },
      });

    let permission;

    if (existingPermission) {
      // Atualizar permissão existente (mesmo que deletada)
      permission = await this.prisma.userModulePermission.update({
        where: { id: existingPermission.id },
        data: {
          permission: dto.permission,
          deletedAt: null, // Restaurar se estava deletada
        },
        include: {
          companyModule: {
            select: {
              id: true,
              moduleId: true,
              isEnabled: true,
              module: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } else {
      // Criar nova permissão
      permission = await this.prisma.userModulePermission.create({
        data: {
          userId,
          companyModuleId: dto.companyModuleId,
          permission: dto.permission,
        },
        include: {
          companyModule: {
            select: {
              id: true,
              moduleId: true,
              isEnabled: true,
              module: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }

    return new UserPermissionResponseDto({
      ...permission,
      permission: permission.permission as Permission,
      companyModule: {
        ...permission.companyModule,
        moduleType: permission.companyModule.module.type as ModuleType,
        module: {
          ...permission.companyModule.module,
          type: permission.companyModule.module.type as ModuleType,
        },
      },
    });
  }

  /**
   * Lista todas as permissões de um usuário.
   */
  async findUserPermissions(
    userId: string,
    requestingUser: { id: string; role: Role; companyId: string },
  ): Promise<UserPermissionResponseDto[]> {
    // Buscar o usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Validar acesso
    if (requestingUser.role !== Role.MASTER) {
      if (user.companyId !== requestingUser.companyId) {
        throw new ForbiddenException(
          'Você não pode visualizar permissões de usuários de outra empresa',
        );
      }
    }

    const permissions = await this.prisma.userModulePermission.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
        companyModule: {
          select: {
            id: true,
            moduleId: true,
            isEnabled: true,
            module: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return permissions.map(
      (p) =>
        new UserPermissionResponseDto({
          ...p,
          permission: p.permission as Permission,
          companyModule: {
            ...p.companyModule,
            moduleType: p.companyModule.module.type as ModuleType,
            module: {
              ...p.companyModule.module,
              type: p.companyModule.module.type as ModuleType,
            },
          },
        }),
    );
  }

  /**
   * Atualiza uma permissão de usuário.
   */
  async updateUserPermission(
    userId: string,
    permissionId: string,
    dto: UpdatePermissionDto,
    requestingUser: { id: string; role: Role; companyId: string },
  ): Promise<UserPermissionResponseDto> {
    // Buscar a permissão
    const permission = await this.prisma.userModulePermission.findFirst({
      where: {
        id: permissionId,
        userId,
        deletedAt: null,
      },
      include: {
        user: true,
      },
    });

    if (!permission) {
      throw new NotFoundException('Permissão não encontrada');
    }

    // Validar acesso
    if (requestingUser.role !== Role.MASTER) {
      if (permission.user.companyId !== requestingUser.companyId) {
        throw new ForbiddenException(
          'Você não pode atualizar permissões de usuários de outra empresa',
        );
      }
    }

    // Atualizar
    const updated = await this.prisma.userModulePermission.update({
      where: { id: permissionId },
      data: {
        permission: dto.permission,
      },
      include: {
        companyModule: {
          select: {
            id: true,
            moduleId: true,
            isEnabled: true,
            module: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return new UserPermissionResponseDto({
      ...updated,
      permission: updated.permission as Permission,
      companyModule: {
        ...updated.companyModule,
        moduleType: updated.companyModule.module.type as ModuleType,
        module: {
          ...updated.companyModule.module,
          type: updated.companyModule.module.type as ModuleType,
        },
      },
    });
  }

  /**
   * Remove uma permissão de usuário (soft-delete).
   */
  async removeUserPermission(
    userId: string,
    permissionId: string,
    requestingUser: { id: string; role: Role; companyId: string },
  ): Promise<void> {
    // Buscar a permissão
    const permission = await this.prisma.userModulePermission.findFirst({
      where: {
        id: permissionId,
        userId,
        deletedAt: null,
      },
      include: {
        user: true,
      },
    });

    if (!permission) {
      throw new NotFoundException('Permissão não encontrada');
    }

    // Validar acesso
    if (requestingUser.role !== Role.MASTER) {
      if (permission.user.companyId !== requestingUser.companyId) {
        throw new ForbiddenException(
          'Você não pode remover permissões de usuários de outra empresa',
        );
      }
    }

    // Soft-delete
    await this.prisma.userModulePermission.update({
      where: { id: permissionId },
      data: {
        deletedAt: new Date(),
        permission: Permission.NONE,
      },
    });
  }

  /**
   * Verifica se um usuário tem uma permissão específica para um módulo.
   */
  async checkUserPermission(
    userId: string,
    moduleType: ModuleType,
    requiredPermission: Permission,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      return false;
    }

    // Masters têm acesso total
    if (user.role === Role.MASTER) {
      return true;
    }

    // Buscar o módulo global por tipo
    const module = await this.prisma.module.findUnique({
      where: { type: moduleType },
    });

    if (!module) {
      return false;
    }

    // Buscar o módulo da empresa
    const companyModule = await this.prisma.companyModule.findFirst({
      where: {
        companyId: user.companyId ?? undefined,
        moduleId: module.id,
        deletedAt: null,
        isEnabled: true,
      },
    });

    if (!companyModule) {
      return false;
    }

    // Buscar a permissão do usuário
    const userPermission = await this.prisma.userModulePermission.findUnique({
      where: {
        user_module_permission_unique: {
          userId,
          companyModuleId: companyModule.id,
        },
        deletedAt: null,
      },
    });

    if (!userPermission) {
      // Usar permissão padrão do módulo
      return this.comparePermissions(
        companyModule.defaultPermission as Permission,
        requiredPermission,
      );
    }

    return this.comparePermissions(
      userPermission.permission as Permission,
      requiredPermission,
    );
  }

  /**
   * Compara permissões (hierarquia: NONE < READ < WRITE < ADMIN).
   */
  private comparePermissions(
    userPermission: Permission,
    requiredPermission: Permission,
  ): boolean {
    const hierarchy = {
      [Permission.NONE]: 0,
      [Permission.READ]: 1,
      [Permission.WRITE]: 2,
      [Permission.ADMIN]: 3,
    };

    return hierarchy[userPermission] >= hierarchy[requiredPermission];
  }
}
