import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
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
    it('deve permitir acesso se não há roles requeridos', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = mockExecutionContext({ role: Role.CLIENT });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('deve permitir acesso se roles requeridos estão vazios', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

      const context = mockExecutionContext({ role: Role.CLIENT });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('deve lançar ForbiddenException se usuário não está autenticado', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const context = mockExecutionContext(null);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Usuário não autenticado',
      );
    });

    it('deve permitir acesso se usuário tem role requerido', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const context = mockExecutionContext({ role: Role.ADMIN });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('deve permitir acesso se usuário tem um dos roles requeridos', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.ADMIN, Role.MANAGER]);

      const context = mockExecutionContext({ role: Role.MANAGER });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('deve negar acesso se usuário não tem nenhum dos roles requeridos', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.ADMIN, Role.MASTER]);

      const context = mockExecutionContext({ role: Role.CLIENT });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Acesso negado');
    });

    it('deve permitir acesso para MASTER quando requerido', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.MASTER]);

      const context = mockExecutionContext({ role: Role.MASTER });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
