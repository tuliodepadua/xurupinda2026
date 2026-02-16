import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '../enums';

/**
 * Guard para garantir isolamento multi-tenant
 * Injeta o companyId do usuário no request para uso posterior
 * Masters podem acessar qualquer tenant
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Masters não têm restrição de tenant
    if (user.role === Role.MASTER) {
      request.tenantId = null; // Indica acesso global
      return true;
    }

    // Valida se o usuário tem companyId
    if (!user.companyId) {
      throw new ForbiddenException('Usuário sem empresa associada');
    }

    // Injeta o companyId no request para uso em queries
    request.tenantId = user.companyId;

    return true;
  }
}
