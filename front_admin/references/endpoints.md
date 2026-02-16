# Endpoints do Xurupinda Admin Backend

Este documento lista todos os endpoints disponíveis na API do sistema administrativo Xurupinda.

---

## 🔐 Autenticação (`/auth`)

### `POST /auth/login`
**Objetivo:** Realizar login no sistema com email e senha.
- **Autenticação:** Público (não requer token)
- **Permissões:** Nenhuma
- **Descrição:** Autentica o usuário e retorna tokens JWT (access token e refresh token)

### `POST /auth/refresh`
**Objetivo:** Renovar o access token expirado.
- **Autenticação:** Público (não requer token)
- **Permissões:** Nenhuma
- **Descrição:** Gera novo access token utilizando um refresh token válido

### `POST /auth/logout`
**Objetivo:** Realizar logout do sistema.
- **Autenticação:** Público (não requer token)
- **Permissões:** Nenhuma
- **Descrição:** Invalida o refresh token do usuário, encerrando a sessão

---

## 🏢 Empresas (`/companies`)

### `POST /companies`
**Objetivo:** Criar uma nova empresa no sistema.
- **Autenticação:** Requerida
- **Permissões:** MASTER
- **Descrição:** Cadastra uma nova empresa com todos os dados necessários

### `GET /companies`
**Objetivo:** Listar todas as empresas cadastradas.
- **Autenticação:** Requerida
- **Permissões:** MASTER
- **Descrição:** Retorna lista paginada de empresas (suporta query params: page, limit)

### `GET /companies/:id`
**Objetivo:** Buscar uma empresa específica por ID.
- **Autenticação:** Requerida
- **Permissões:** MASTER
- **Descrição:** Retorna os dados completos de uma empresa pelo seu ID

### `GET /companies/slug/:slug`
**Objetivo:** Buscar uma empresa específica por slug.
- **Autenticação:** Requerida
- **Permissões:** MASTER
- **Descrição:** Retorna os dados completos de uma empresa pelo seu slug único

### `PATCH /companies/:id`
**Objetivo:** Atualizar dados de uma empresa.
- **Autenticação:** Requerida
- **Permissões:** MASTER
- **Descrição:** Atualiza parcialmente os dados de uma empresa existente

### `DELETE /companies/:id`
**Objetivo:** Remover uma empresa do sistema.
- **Autenticação:** Requerida
- **Permissões:** MASTER
- **Descrição:** Realiza soft-delete da empresa (marca como deletada sem remover do banco)

### `PATCH /companies/:id/restore`
**Objetivo:** Restaurar uma empresa deletada.
- **Autenticação:** Requerida
- **Permissões:** MASTER
- **Descrição:** Restaura uma empresa que foi previamente deletada (soft-delete)

---

## 👥 Usuários (`/users`)

### `POST /users`
**Objetivo:** Criar um novo usuário no sistema.
- **Autenticação:** Requerida
- **Permissões:** MASTER, ADMIN
- **Descrição:** Cadastra um novo usuário. MASTER pode criar qualquer tipo de usuário, ADMIN pode criar apenas MANAGER e CLIENT

### `GET /users`
**Objetivo:** Listar usuários do sistema.
- **Autenticação:** Requerida
- **Permissões:** MASTER, ADMIN, MANAGER, CLIENT
- **Descrição:** Retorna lista paginada de usuários com filtro automático por tenant (MASTER vê todos, outros veem apenas da sua empresa)

### `GET /users/:id`
**Objetivo:** Buscar um usuário específico por ID.
- **Autenticação:** Requerida
- **Permissões:** MASTER, ADMIN, MANAGER, CLIENT
- **Descrição:** Retorna os dados completos de um usuário respeitando as regras de tenant

### `PATCH /users/:id`
**Objetivo:** Atualizar dados de um usuário.
- **Autenticação:** Requerida
- **Permissões:** MASTER, ADMIN, MANAGER, CLIENT
- **Descrição:** Atualiza dados do usuário. MASTER atualiza qualquer usuário, ADMIN atualiza MANAGER e CLIENT da sua empresa, outros atualizam apenas seu próprio perfil

### `DELETE /users/:id`
**Objetivo:** Remover um usuário do sistema.
- **Autenticação:** Requerida
- **Permissões:** MASTER, ADMIN
- **Descrição:** Realiza soft-delete do usuário. MASTER deleta qualquer usuário, ADMIN deleta apenas MANAGER e CLIENT da sua empresa

### `PATCH /users/:id/restore`
**Objetivo:** Restaurar um usuário deletado.
- **Autenticação:** Requerida
- **Permissões:** MASTER, ADMIN
- **Descrição:** Restaura um usuário que foi previamente deletado (soft-delete)

---

## 📦 Módulos Globais (`/modules/global`)

### `GET /modules/global`
**Objetivo:** Listar todos os módulos globais disponíveis no sistema.
- **Autenticação:** Requerida
- **Permissões:** MASTER
- **Descrição:** Retorna lista completa de módulos que podem ser habilitados para empresas

### `GET /modules/global/:moduleId`
**Objetivo:** Buscar detalhes de um módulo global específico.
- **Autenticação:** Requerida
- **Permissões:** MASTER
- **Descrição:** Retorna informações detalhadas de um módulo específico pelo seu ID

---

## 🏢 Módulos de Empresa (`/modules/companies`)

### `POST /modules/companies/:companyId/enable`
**Objetivo:** Habilitar um módulo para uma empresa específica.
- **Autenticação:** Requerida
- **Permissões:** MASTER
- **Descrição:** Ativa um módulo global para uso em uma empresa específica, com possibilidade de configuração personalizada

### `DELETE /modules/companies/:companyId/disable/:moduleId`
**Objetivo:** Desabilitar um módulo de uma empresa.
- **Autenticação:** Requerida
- **Permissões:** MASTER
- **Descrição:** Desativa um módulo da empresa e remove todas as permissões relacionadas em cascata

### `PATCH /modules/companies/:companyId/modules/:moduleId`
**Objetivo:** Atualizar configurações de um módulo habilitado para uma empresa.
- **Autenticação:** Requerida
- **Permissões:** MASTER
- **Descrição:** Modifica configurações personalizadas de um módulo já habilitado para a empresa

### `GET /modules/companies/:companyId`
**Objetivo:** Listar todos os módulos habilitados de uma empresa.
- **Autenticação:** Requerida
- **Permissões:** MASTER, ADMIN
- **Descrição:** Retorna lista de módulos ativos na empresa. ADMIN vê apenas módulos da sua própria empresa

---

## 👤 Permissões de Usuário (`/modules/users`)

### `POST /modules/users/:userId/permissions`
**Objetivo:** Atribuir uma permissão de módulo a um usuário.
- **Autenticação:** Requerida
- **Permissões:** MASTER, ADMIN
- **Descrição:** Concede acesso de um usuário a um módulo específico da empresa com nível de permissão definido

### `GET /modules/users/:userId/permissions`
**Objetivo:** Listar todas as permissões de um usuário.
- **Autenticação:** Requerida
- **Permissões:** MASTER, ADMIN, MANAGER
- **Descrição:** Retorna lista de módulos e permissões que o usuário possui acesso

### `PATCH /modules/users/:userId/permissions/:permissionId`
**Objetivo:** Atualizar uma permissão existente de um usuário.
- **Autenticação:** Requerida
- **Permissões:** MASTER, ADMIN
- **Descrição:** Modifica o nível de permissão de um usuário em um módulo específico

### `DELETE /modules/users/:userId/permissions/:permissionId`
**Objetivo:** Remover uma permissão de um usuário.
- **Autenticação:** Requerida
- **Permissões:** MASTER, ADMIN
- **Descrição:** Remove o acesso do usuário a um módulo específico

---

## 📝 Notas Importantes

### Hierarquia de Roles
1. **MASTER**: Acesso total ao sistema, gerencia empresas e todos os usuários
2. **ADMIN**: Gerencia usuários e módulos dentro da sua empresa
3. **MANAGER**: Acesso intermediário, pode visualizar permissões
4. **CLIENT**: Acesso básico, visualiza apenas seus próprios dados

### Autenticação
- Endpoints públicos: `/auth/*` (não requerem autenticação)
- Todos os outros endpoints requerem token JWT no header `Authorization: Bearer <token>`

### Multi-tenancy
- O sistema implementa isolamento por tenant (empresa)
- Usuários não-MASTER só acessam dados da própria empresa
- Filtros de tenant são aplicados automaticamente em nível de serviço e interceptor

### Paginação
- Endpoints de listagem suportam query params: `page` (padrão: 1) e `limit` (padrão: 10)
- Retorno: `{ data: [], total: number, page: number, limit: number, totalPages: number }`

### Soft Delete
- Operações de DELETE são soft-delete (mantém registro no banco marcado como deletado)
- Registros deletados podem ser restaurados via endpoints `/restore`
