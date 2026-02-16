import { Role } from '../enums/role.enum';

/**
 * Interface para o payload do JWT
 * Define os dados armazenados no token de acesso
 */
export interface JwtPayload {
  /**
   * ID único do usuário
   */
  sub: string;

  /**
   * Email do usuário
   */
  email: string;

  /**
   * Role/papel do usuário no sistema
   */
  role: Role;

  /**
   * ID da empresa (tenant) do usuário
   * null para usuários MASTER
   */
  companyId: string | null;

  /**
   * Slug da empresa (tenant) do usuário
   * null para usuários MASTER
   */
  companySlug: string | null;

  /**
   * Timestamp de emissão do token
   */
  iat?: number;

  /**
   * Timestamp de expiração do token
   */
  exp?: number;
}
