import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsGuard } from './permissions.guard';
import { PrismaService } from '../../database/prisma.service';
import { ModuleType, Permission, Role } from '../enums';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            userModulePermission: {
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
    reflector = module.get<Reflector>(Reflector);
    prisma = module.get<PrismaService>(PrismaService);
  });

  const mockExecutionContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  describe('canActivate', () => {
    it('deve permitir acesso se não há permissão requerida', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = mockExecutionContext({
        sub: 'user-id',
        role: Role.CLIENT,
      });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('deve lançar ForbiddenException se usuário não está autenticado', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        module: ModuleType.FINANCIAL,
        permission: Permission.READ,
      });

      const context = mockExecutionContext(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Usuário não autenticado',
      );
    });

    it('deve permitir acesso para MASTER sem verificar permissões', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        module: ModuleType.FINANCIAL,
        permission: Permission.ADMIN,
      });

      const context = mockExecutionContext({
        sub: 'master-id',
        role: Role.MASTER,
        companyId: 'company-id',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prisma.userModulePermission.findFirst).not.toHaveBeenCalled();
    });

    it('deve negar acesso se usuário não tem permissão no módulo', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        module: ModuleType.FINANCIAL,
        permission: Permission.READ,
      });

      jest
        .spyOn(prisma.userModulePermission, 'findFirst')
        .mockResolvedValue(null);

      const context = mockExecutionContext({
        sub: 'user-id',
        role: Role.CLIENT,
        companyId: 'company-id',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Acesso negado ao módulo',
      );
    });

    it('deve permitir acesso se usuário tem permissão READ e requer READ', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        module: ModuleType.FINANCIAL,
        permission: Permission.READ,
      });

      jest.spyOn(prisma.userModulePermission, 'findFirst').mockResolvedValue({
        permission: Permission.READ,
      } as any);

      const context = mockExecutionContext({
        sub: 'user-id',
        role: Role.CLIENT,
        companyId: 'company-id',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('deve permitir acesso se usuário tem permissão WRITE e requer READ', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        module: ModuleType.FINANCIAL,
        permission: Permission.READ,
      });

      jest.spyOn(prisma.userModulePermission, 'findFirst').mockResolvedValue({
        permission: Permission.WRITE,
      } as any);

      const context = mockExecutionContext({
        sub: 'user-id',
        role: Role.ADMIN,
        companyId: 'company-id',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('deve negar acesso se usuário tem permissão READ e requer WRITE', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        module: ModuleType.FINANCIAL,
        permission: Permission.WRITE,
      });

      jest.spyOn(prisma.userModulePermission, 'findFirst').mockResolvedValue({
        permission: Permission.READ,
      } as any);

      const context = mockExecutionContext({
        sub: 'user-id',
        role: Role.CLIENT,
        companyId: 'company-id',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Permissão insuficiente',
      );
    });

    it('deve permitir acesso se usuário tem permissão ADMIN e requer qualquer coisa', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        module: ModuleType.FINANCIAL,
        permission: Permission.WRITE,
      });

      jest.spyOn(prisma.userModulePermission, 'findFirst').mockResolvedValue({
        permission: Permission.ADMIN,
      } as any);

      const context = mockExecutionContext({
        sub: 'user-id',
        role: Role.ADMIN,
        companyId: 'company-id',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('deve negar acesso se usuário tem permissão NONE', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        module: ModuleType.FINANCIAL,
        permission: Permission.READ,
      });

      jest.spyOn(prisma.userModulePermission, 'findFirst').mockResolvedValue({
        permission: Permission.NONE,
      } as any);

      const context = mockExecutionContext({
        sub: 'user-id',
        role: Role.CLIENT,
        companyId: 'company-id',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Permissão insuficiente',
      );
    });
  });
});
