import { SetMetadata } from '@nestjs/common';
import { ModuleType } from '../enums/module-type.enum';
import { Permission } from '../enums/permission.enum';

/**
 * Interface para definir permissão requerida
 */
export interface RequiredPermission {
  module: ModuleType;
  permission: Permission;
}

/**
 * Decorator para exigir permissão específica em um módulo
 *
 * @example
 * ```typescript
 * @RequirePermission(ModuleType.FINANCIAL, Permission.WRITE)
 * @Post('create-invoice')
 * createInvoice(@Body() dto: CreateInvoiceDto) {
 *   return this.service.create(dto);
 * }
 * ```
 */
export const PERMISSION_KEY = 'permission';
export const RequirePermission = (module: ModuleType, permission: Permission) =>
  SetMetadata(PERMISSION_KEY, { module, permission });
