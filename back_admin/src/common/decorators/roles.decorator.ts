import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

/**
 * Decorator para definir quais roles têm acesso a uma rota
 *
 * @example
 * ```typescript
 * @Roles(Role.ADMIN, Role.MASTER)
 * @Get('admin-only')
 * adminRoute() {
 *   return 'Only admins and masters can access';
 * }
 * ```
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
