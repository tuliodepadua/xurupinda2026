import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator para obter o ID da empresa (tenant) do usuário autenticado
 *
 * @example
 * ```typescript
 * @Get('my-company-data')
 * getCompanyData(@CurrentTenant() companyId: string) {
 *   return this.service.findByCompany(companyId);
 * }
 * ```
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.companyId || null;
  },
);
