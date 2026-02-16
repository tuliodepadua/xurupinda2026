import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { ModuleType, Permission, Role } from '../enums';

/**
 * Guard para validar permissões granulares por módulo
 * Masters têm acesso total, outros usuários precisam de permissão específica
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<{
      module: ModuleType;
      permission: Permission;
    }>('permission', [context.getHandler(), context.getClass()]);

    // Se não há permissão requerida, permite acesso
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Masters têm acesso total a tudo
    if (user.role === Role.MASTER) {
      return true;
    }

    // Busca a permissão do usuário no módulo específico
    const userPermission = await this.prisma.userModulePermission.findFirst({
      where: {
        userId: user.sub,
        companyModule: {
          companyId: user.companyId,
          module: {
            type: requiredPermission.module,
          },
          isEnabled: true,
          deletedAt: null,
        },
        deletedAt: null,
      },
      select: {
        permission: true,
      },
    });

    // Se não encontrou permissão, nega acesso
    if (!userPermission) {
      throw new ForbiddenException(
        `Acesso negado ao módulo ${requiredPermission.module}`,
      );
    }

    // Valida o nível de permissão
    const hasPermission = this.checkPermissionLevel(
      userPermission.permission as Permission,
      requiredPermission.permission,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Permissão insuficiente. Necessário: ${requiredPermission.permission}, Atual: ${userPermission.permission}`,
      );
    }

    return true;
  }

  /**
   * Verifica se a permissão do usuário é suficiente para a ação requerida
   * Hierarquia: NONE < READ < WRITE < ADMIN
   */
  private checkPermissionLevel(
    userPermission: Permission,
    requiredPermission: Permission,
  ): boolean {
    const permissionLevels = {
      [Permission.NONE]: 0,
      [Permission.READ]: 1,
      [Permission.WRITE]: 2,
      [Permission.ADMIN]: 3,
    };

    return (
      permissionLevels[userPermission] >= permissionLevels[requiredPermission]
    );
  }
}
