/**
 * Enum de permissões granulares por módulo
 * Define o nível de acesso que um usuário tem em cada módulo
 */
export enum Permission {
  /**
   * Sem acesso ao módulo
   * Usuário não pode visualizar nem interagir
   */
  NONE = 'NONE',

  /**
   * Apenas visualização
   * Pode ver dados mas não pode modificar
   */
  READ = 'READ',

  /**
   * Leitura e escrita
   * Pode visualizar e modificar dados (inserir/editar formulários)
   */
  WRITE = 'WRITE',

  /**
   * Acesso administrativo completo ao módulo
   * Inclui configurações e gestão avançada
   */
  ADMIN = 'ADMIN',
}
