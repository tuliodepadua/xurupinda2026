import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { TenantInterceptor } from './tenant.interceptor';
import { Role } from '../enums';

describe('TenantInterceptor', () => {
  let interceptor: TenantInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantInterceptor],
    }).compile();

    interceptor = module.get<TenantInterceptor>(TenantInterceptor);
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

  const mockCallHandler: CallHandler = {
    handle: () => of({}),
  };

  describe('intercept', () => {
    it('deve prosseguir sem adicionar tenantId se não há usuário', (done) => {
      const request = {};
      const context = {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;

      interceptor.intercept(context, mockCallHandler).subscribe(() => {
        expect(request['tenantId']).toBeUndefined();
        done();
      });
    });

    it('deve definir tenantId como null para MASTER', (done) => {
      const request = {
        user: {
          role: Role.MASTER,
          companyId: 'some-company',
        },
      };
      const context = {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;

      interceptor.intercept(context, mockCallHandler).subscribe(() => {
        expect(request.tenantId).toBeNull();
        done();
      });
    });

    it('deve adicionar tenantId para usuário ADMIN', (done) => {
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

      interceptor.intercept(context, mockCallHandler).subscribe(() => {
        expect(request.tenantId).toBe('company-123');
        done();
      });
    });

    it('deve adicionar tenantId para usuário MANAGER', (done) => {
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

      interceptor.intercept(context, mockCallHandler).subscribe(() => {
        expect(request.tenantId).toBe('company-456');
        done();
      });
    });

    it('deve adicionar tenantId para usuário CLIENT', (done) => {
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

      interceptor.intercept(context, mockCallHandler).subscribe(() => {
        expect(request.tenantId).toBe('company-789');
        done();
      });
    });

    it('não deve adicionar tenantId se usuário não tem companyId', (done) => {
      const request = {
        user: {
          role: Role.ADMIN,
          companyId: undefined,
        },
      };
      const context = {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;

      interceptor.intercept(context, mockCallHandler).subscribe(() => {
        expect(request.tenantId).toBeUndefined();
        done();
      });
    });
  });
});
