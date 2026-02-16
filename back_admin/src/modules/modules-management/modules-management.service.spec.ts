import { Test, TestingModule } from '@nestjs/testing';
import { ModulesManagementService } from './modules-management.service';
import { PrismaService } from '../../database/prisma.service';
import { ModuleType, Permission, Role } from '../../common/enums';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

describe('ModulesManagementService', () => {
  let service: ModulesManagementService;
  let prisma: PrismaService;

  const mockPrismaService = {
    company: {
      findUnique: jest.fn(),
    },
    companyModule: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    userModulePermission: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModulesManagementService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ModulesManagementService>(ModulesManagementService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enableModuleForCompany', () => {
    const companyId = 'company-1';
    const userId = 'user-1';
    const dto = {
      moduleType: ModuleType.FINANCIAL,
      defaultPermission: Permission.READ,
      isEnabled: true,
    };

    it('deve habilitar um novo módulo para uma empresa', async () => {
      const company = { id: companyId, name: 'Test Company', deletedAt: null };
      const newModule = {
        id: 'module-1',
        companyId,
        moduleType: ModuleType.FINANCIAL,
        isEnabled: true,
        defaultPermission: Permission.READ,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.company.findUnique.mockResolvedValue(company);
      mockPrismaService.companyModule.findUnique.mockResolvedValue(null);
      mockPrismaService.companyModule.create.mockResolvedValue(newModule);

      const result = await service.enableModuleForCompany(
        companyId,
        dto,
        userId,
      );

      expect(result.id).toBe('module-1');
      expect(result.moduleType).toBe(ModuleType.FINANCIAL);
      expect(mockPrismaService.companyModule.create).toHaveBeenCalledWith({
        data: {
          companyId,
          moduleType: ModuleType.FINANCIAL,
          isEnabled: true,
          defaultPermission: Permission.READ,
        },
      });
    });

    it('deve restaurar um módulo deletado', async () => {
      const company = { id: companyId, name: 'Test Company', deletedAt: null };
      const existingModule = {
        id: 'module-1',
        companyId,
        moduleType: ModuleType.FINANCIAL,
        isEnabled: false,
        defaultPermission: Permission.NONE,
        deletedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const restoredModule = {
        ...existingModule,
        deletedAt: null,
        isEnabled: true,
      };

      mockPrismaService.company.findUnique.mockResolvedValue(company);
      mockPrismaService.companyModule.findUnique.mockResolvedValue(
        existingModule,
      );
      mockPrismaService.companyModule.update.mockResolvedValue(restoredModule);

      const result = await service.enableModuleForCompany(
        companyId,
        dto,
        userId,
      );

      expect(result.deletedAt).toBeNull();
      expect(result.isEnabled).toBe(true);
      expect(mockPrismaService.companyModule.update).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se a empresa não existir', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue(null);

      await expect(
        service.enableModuleForCompany(companyId, dto, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('disableModuleForCompany', () => {
    const companyId = 'company-1';
    const moduleType = ModuleType.FINANCIAL;
    const userId = 'user-1';

    it('deve desabilitar um módulo e aplicar cascata', async () => {
      const company = { id: companyId, name: 'Test Company', deletedAt: null };
      const companyModule = {
        id: 'module-1',
        companyId,
        moduleType,
        isEnabled: true,
        defaultPermission: Permission.READ,
        deletedAt: null,
      };

      mockPrismaService.company.findUnique.mockResolvedValue(company);
      mockPrismaService.companyModule.findUnique.mockResolvedValue(
        companyModule,
      );
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );

      await service.disableModuleForCompany(companyId, moduleType, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se o módulo não existir', async () => {
      const company = { id: companyId, name: 'Test Company', deletedAt: null };

      mockPrismaService.company.findUnique.mockResolvedValue(company);
      mockPrismaService.companyModule.findUnique.mockResolvedValue(null);

      await expect(
        service.disableModuleForCompany(companyId, moduleType, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findCompanyModules', () => {
    const companyId = 'company-1';

    it('deve listar módulos da empresa para Master', async () => {
      const requestingUser = {
        id: 'user-1',
        role: Role.MASTER,
        companyId: 'other-company',
      };
      const modules = [
        {
          id: 'module-1',
          companyId,
          moduleType: ModuleType.FINANCIAL,
          isEnabled: true,
          defaultPermission: Permission.READ,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.companyModule.findMany.mockResolvedValue(modules);

      const result = await service.findCompanyModules(
        companyId,
        requestingUser,
      );

      expect(result).toHaveLength(1);
      expect(result[0].moduleType).toBe(ModuleType.FINANCIAL);
    });

    it('deve listar módulos da própria empresa para Admin', async () => {
      const requestingUser = {
        id: 'user-1',
        role: Role.ADMIN,
        companyId,
      };
      const modules = [
        {
          id: 'module-1',
          companyId,
          moduleType: ModuleType.SALES,
          isEnabled: true,
          defaultPermission: Permission.WRITE,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.companyModule.findMany.mockResolvedValue(modules);

      const result = await service.findCompanyModules(
        companyId,
        requestingUser,
      );

      expect(result).toHaveLength(1);
    });

    it('deve lançar ForbiddenException se Admin tentar acessar outra empresa', async () => {
      const requestingUser = {
        id: 'user-1',
        role: Role.ADMIN,
        companyId: 'other-company',
      };

      await expect(
        service.findCompanyModules(companyId, requestingUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('assignPermissionToUser', () => {
    const userId = 'user-1';
    const dto = {
      companyModuleId: 'module-1',
      permission: Permission.WRITE,
    };

    it('deve atribuir permissão a um usuário', async () => {
      const requestingUser = {
        id: 'admin-1',
        role: Role.ADMIN,
        companyId: 'company-1',
      };
      const user = {
        id: userId,
        email: 'user@test.com',
        companyId: 'company-1',
        deletedAt: null,
      };
      const companyModule = {
        id: 'module-1',
        companyId: 'company-1',
        moduleType: ModuleType.FINANCIAL,
        isEnabled: true,
        deletedAt: null,
      };
      const permission = {
        id: 'permission-1',
        userId,
        companyModuleId: 'module-1',
        permission: Permission.WRITE,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        companyModule: {
          id: 'module-1',
          moduleType: ModuleType.FINANCIAL,
          isEnabled: true,
        },
        user: {
          id: userId,
          name: 'Test User',
          email: 'user@test.com',
        },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.companyModule.findFirst.mockResolvedValue(
        companyModule,
      );
      mockPrismaService.userModulePermission.findUnique.mockResolvedValue(null);
      mockPrismaService.userModulePermission.create.mockResolvedValue(
        permission,
      );

      const result = await service.assignPermissionToUser(
        userId,
        dto,
        requestingUser,
      );

      expect(result.permission).toBe(Permission.WRITE);
      expect(mockPrismaService.userModulePermission.create).toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se módulo não está disponível', async () => {
      const requestingUser = {
        id: 'admin-1',
        role: Role.ADMIN,
        companyId: 'company-1',
      };
      const user = {
        id: userId,
        email: 'user@test.com',
        companyId: 'company-1',
        deletedAt: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.companyModule.findFirst.mockResolvedValue(null);

      await expect(
        service.assignPermissionToUser(userId, dto, requestingUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar ForbiddenException se Admin tentar atribuir para outra empresa', async () => {
      const requestingUser = {
        id: 'admin-1',
        role: Role.ADMIN,
        companyId: 'company-1',
      };
      const user = {
        id: userId,
        email: 'user@test.com',
        companyId: 'other-company',
        deletedAt: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      await expect(
        service.assignPermissionToUser(userId, dto, requestingUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findUserPermissions', () => {
    const userId = 'user-1';

    it('deve listar permissões de um usuário', async () => {
      const requestingUser = {
        id: 'admin-1',
        role: Role.ADMIN,
        companyId: 'company-1',
      };
      const user = {
        id: userId,
        companyId: 'company-1',
        deletedAt: null,
      };
      const permissions = [
        {
          id: 'permission-1',
          userId,
          companyModuleId: 'module-1',
          permission: Permission.WRITE,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          companyModule: {
            id: 'module-1',
            moduleType: ModuleType.FINANCIAL,
            isEnabled: true,
          },
          user: {
            id: userId,
            name: 'Test User',
            email: 'user@test.com',
          },
        },
      ];

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.userModulePermission.findMany.mockResolvedValue(
        permissions,
      );

      const result = await service.findUserPermissions(userId, requestingUser);

      expect(result).toHaveLength(1);
      expect(result[0].permission).toBe(Permission.WRITE);
    });

    it('deve lançar NotFoundException se usuário não existir', async () => {
      const requestingUser = {
        id: 'admin-1',
        role: Role.ADMIN,
        companyId: 'company-1',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.findUserPermissions(userId, requestingUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkUserPermission', () => {
    const userId = 'user-1';
    const moduleType = ModuleType.FINANCIAL;

    it('deve retornar true para Master', async () => {
      const user = {
        id: userId,
        role: Role.MASTER,
        companyId: 'company-1',
        deletedAt: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.checkUserPermission(
        userId,
        moduleType,
        Permission.ADMIN,
      );

      expect(result).toBe(true);
    });

    it('deve retornar true se usuário tem permissão adequada', async () => {
      const user = {
        id: userId,
        role: Role.ADMIN,
        companyId: 'company-1',
        deletedAt: null,
      };
      const companyModule = {
        id: 'module-1',
        companyId: 'company-1',
        moduleType,
        isEnabled: true,
        defaultPermission: Permission.READ,
        deletedAt: null,
      };
      const userPermission = {
        id: 'permission-1',
        userId,
        companyModuleId: 'module-1',
        permission: Permission.WRITE,
        deletedAt: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.companyModule.findFirst.mockResolvedValue(
        companyModule,
      );
      mockPrismaService.userModulePermission.findUnique.mockResolvedValue(
        userPermission,
      );

      const result = await service.checkUserPermission(
        userId,
        moduleType,
        Permission.READ,
      );

      expect(result).toBe(true);
    });

    it('deve retornar false se módulo não está habilitado', async () => {
      const user = {
        id: userId,
        role: Role.ADMIN,
        companyId: 'company-1',
        deletedAt: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.companyModule.findFirst.mockResolvedValue(null);

      const result = await service.checkUserPermission(
        userId,
        moduleType,
        Permission.READ,
      );

      expect(result).toBe(false);
    });

    it('deve usar permissão padrão se usuário não tem permissão específica', async () => {
      const user = {
        id: userId,
        role: Role.CLIENT,
        companyId: 'company-1',
        deletedAt: null,
      };
      const companyModule = {
        id: 'module-1',
        companyId: 'company-1',
        moduleType,
        isEnabled: true,
        defaultPermission: Permission.READ,
        deletedAt: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.companyModule.findFirst.mockResolvedValue(
        companyModule,
      );
      mockPrismaService.userModulePermission.findUnique.mockResolvedValue(null);

      const result = await service.checkUserPermission(
        userId,
        moduleType,
        Permission.READ,
      );

      expect(result).toBe(true);
    });
  });

  describe('updateUserPermission', () => {
    const userId = 'user-1';
    const permissionId = 'permission-1';
    const dto = { permission: Permission.ADMIN };

    it('deve atualizar permissão de usuário', async () => {
      const requestingUser = {
        id: 'admin-1',
        role: Role.ADMIN,
        companyId: 'company-1',
      };
      const permission = {
        id: permissionId,
        userId,
        companyModuleId: 'module-1',
        permission: Permission.WRITE,
        deletedAt: null,
        user: {
          id: userId,
          companyId: 'company-1',
        },
      };
      const updatedPermission = {
        ...permission,
        permission: Permission.ADMIN,
        companyModule: {
          id: 'module-1',
          moduleType: ModuleType.FINANCIAL,
          isEnabled: true,
        },
        user: {
          id: userId,
          name: 'Test User',
          email: 'user@test.com',
        },
      };

      mockPrismaService.userModulePermission.findFirst.mockResolvedValue(
        permission,
      );
      mockPrismaService.userModulePermission.update.mockResolvedValue(
        updatedPermission,
      );

      const result = await service.updateUserPermission(
        userId,
        permissionId,
        dto,
        requestingUser,
      );

      expect(result.permission).toBe(Permission.ADMIN);
    });

    it('deve lançar NotFoundException se permissão não existir', async () => {
      const requestingUser = {
        id: 'admin-1',
        role: Role.ADMIN,
        companyId: 'company-1',
      };

      mockPrismaService.userModulePermission.findFirst.mockResolvedValue(null);

      await expect(
        service.updateUserPermission(userId, permissionId, dto, requestingUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeUserPermission', () => {
    const userId = 'user-1';
    const permissionId = 'permission-1';

    it('deve remover permissão de usuário (soft-delete)', async () => {
      const requestingUser = {
        id: 'admin-1',
        role: Role.ADMIN,
        companyId: 'company-1',
      };
      const permission = {
        id: permissionId,
        userId,
        companyModuleId: 'module-1',
        permission: Permission.WRITE,
        deletedAt: null,
        user: {
          id: userId,
          companyId: 'company-1',
        },
      };

      mockPrismaService.userModulePermission.findFirst.mockResolvedValue(
        permission,
      );
      mockPrismaService.userModulePermission.update.mockResolvedValue({
        ...permission,
        deletedAt: new Date(),
      });

      await service.removeUserPermission(userId, permissionId, requestingUser);

      expect(
        mockPrismaService.userModulePermission.update,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: permissionId },
          data: expect.objectContaining({
            permission: Permission.NONE,
          }),
        }),
      );
    });
  });

  describe('listAllModuleTypes', () => {
    it('deve retornar todos os tipos de módulos', async () => {
      const result = await service.listAllModuleTypes();

      expect(result).toEqual(Object.values(ModuleType));
      expect(result).toContain(ModuleType.FINANCIAL);
      expect(result).toContain(ModuleType.SALES);
    });
  });
});
