import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Role } from '../enums';

/**
 * Interceptor para adicionar contexto de tenant às queries do Prisma
 * Automaticamente filtra dados por companyId exceto para Masters
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Se não há usuário, prossegue normalmente
    if (!user) {
      return next.handle();
    }

    // Masters têm acesso global (sem filtro de tenant)
    if (user.role === Role.MASTER) {
      request.tenantId = null;
      return next.handle();
    }

    // Adiciona companyId ao contexto do request
    if (user.companyId) {
      request.tenantId = user.companyId;
    }

    return next.handle();
  }
}
