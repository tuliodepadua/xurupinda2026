import { SetMetadata } from '@nestjs/common';

/**
 * Decorator para marcar rotas como públicas (sem autenticação)
 *
 * @example
 * ```typescript
 * @Public()
 * @Post('login')
 * login(@Body() dto: LoginDto) {
 *   return this.authService.login(dto);
 * }
 * ```
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
