import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard JWT para proteger rotas
 * Valida o token JWT em todas as rotas, exceto as marcadas como públicas
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Verifica se a rota pode ser ativada
   * Permite acesso se a rota for pública (@Public decorator)
   */
  canActivate(context: ExecutionContext) {
    // Verificar se a rota é pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Se não for pública, validar JWT
    return super.canActivate(context);
  }
}
