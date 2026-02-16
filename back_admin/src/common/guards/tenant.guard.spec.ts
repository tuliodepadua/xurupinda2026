import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantGuard } from './tenant.guard';
import { Role } from '../enums';

describe('TenantGuard', () => {
  let guard: TenantGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantGuard],
    }).compile();

    guard = module.get<TenantGuard>(TenantGuard);
  });

  const mockExecutionContext = (user: any): ExecutionContext => {
    const request = { user };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  describe('canActivate', () => {
    it('deve lançar ForbiddenException se usuário não está autenticado', () => {
      const context = mockExecutionContext(null);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Usuário não autenticado',
      );
    });

    it('deve permitir acesso para MASTER e definir tenantId como null', () => {
      const request = { user: { role: Role.MASTER } };
      const context = {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.tenantId).toBeNull();
    });

    it('deve lançar ForbiddenException se usuário não-master não tem companyId', () => {
      const context = mockExecutionContext({
        role: Role.ADMIN,
        companyId: null,
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Usuário sem empresa associada',
      );
    });

    it('deve permitir acesso e definir tenantId para usuário ADMIN', () => {
      const request = {
        user: {
          role: Role.ADMIN,
          companyId: 'company-123',
        },
      };
      const context = {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.tenantId).toBe('company-123');
    });

    it('deve permitir acesso e definir tenantId para usuário MANAGER', () => {
      const request = {
        user: {
          role: Role.MANAGER,
          companyId: 'company-456',
        },
      };
      const context = {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.tenantId).toBe('company-456');
    });

    it('deve permitir acesso e definir tenantId para usuário CLIENT', () => {
      const request = {
        user: {
          role: Role.CLIENT,
          companyId: 'company-789',
        },
      };
      const context = {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.tenantId).toBe('company-789');
    });
  });
});
