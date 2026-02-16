/**
 * Enum de tipos de módulos/setores do sistema
 * Define as funcionalidades disponíveis na aplicação
 */
export enum ModuleType {
  /**
   * Gestão de usuários e permissões
   * Criação, edição e controle de acessos
   */
  USER_MANAGEMENT = 'USER_MANAGEMENT',

  /**
   * Módulo financeiro
   * Controle financeiro e faturamento
   */
  FINANCIAL = 'FINANCIAL',

  /**
   * Controle de estoque/inventário
   * Gestão de produtos e materiais
   */
  INVENTORY = 'INVENTORY',

  /**
   * Gestão de vendas e pedidos
   * Processamento de vendas e orçamentos
   */
  SALES = 'SALES',

  /**
   * Agendamentos e calendário
   * Gestão de compromissos e disponibilidade
   */
  SCHEDULES = 'SCHEDULES',

  /**
   * Relatórios e dashboards
   * Análises e visualizações de dados
   */
  REPORTS = 'REPORTS',

  /**
   * Galeria de imagens e mídia
   * Upload e gestão de arquivos multimídia
   */
  IMAGES = 'IMAGES',

  /**
   * Configurações da empresa
   * Parâmetros e preferências do sistema
   */
  SETTINGS = 'SETTINGS',
}
