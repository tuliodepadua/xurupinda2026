/**
 * Enum de papéis/roles dos usuários no sistema
 * Define a hierarquia de permissões
 */
export enum Role {
  /**
   * Usuário mestre do sistema
   * Acesso total sem restrições de tenant
   * Pode gerenciar todas as empresas e módulos globalmente
   */
  MASTER = 'MASTER',

  /**
   * Representante de empresa prestadora de serviços
   * Gerencia apenas sua própria empresa
   * Pode criar Managers e Clients
   * Pode ativar módulos para seus usuários
   */
  ADMIN = 'ADMIN',

  /**
   * Gestor relacionado a uma empresa
   * Acesso aos setores definidos pelo Admin
   * Pode inserir dados em formulários
   */
  MANAGER = 'MANAGER',

  /**
   * Cliente final da empresa
   * Acesso apenas de leitura
   * Visualiza agendas, relatórios e imagens
   */
  CLIENT = 'CLIENT',
}
