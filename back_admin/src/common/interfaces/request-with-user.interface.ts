import { Request } from 'express';
import { Role } from '../enums/role.enum';

/**
 * Interface para o usuário autenticado na requisição
 * Dados básicos extraídos do JWT
 */
export interface AuthenticatedUser {
  /**
   * ID único do usuário
   */
  id: string;

  /**
   * Email do usuário
   */
  email: string;

  /**
   * Nome do usuário
   */
  name: string;

  /**
   * Role/papel do usuário
   */
  role: Role;

  /**
   * ID da empresa (tenant) do usuário
   * null para usuários MASTER
   */
  companyId: string | null;
}

/**
 * Interface estendida do Request do Express
 * Inclui dados do usuário autenticado
 */
export interface RequestWithUser extends Request {
  /**
   * Usuário autenticado
   */
  user: AuthenticatedUser;
}
