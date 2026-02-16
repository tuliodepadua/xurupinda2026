# Sistema de Guards e Autorização

Este documento descreve como usar os guards e o interceptor de autorização implementados na Fase 4.

## Guards Disponíveis

### 1. JwtAuthGuard
Valida se o usuário está autenticado via JWT.

```typescript
import { JwtAuthGuard } from '@/common/guards';

@Controller('protected')
@UseGuards(JwtAuthGuard)
export class ProtectedController {
  // Todos os endpoints deste controller requerem autenticação
}
```

Para rotas públicas, use o decorator `@Public()`:

```typescript
import { Public } from '@/common/decorators';

@Controller('auth')
export class AuthController {
  @Public()
  @Post('login')
  login() {
    // Esta rota não requer autenticação
  }
}
```

### 2. RolesGuard
Valida se o usuário tem um dos roles requeridos.

```typescript
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { Role } from '@/common/enums';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get()
  @Roles(Role.MASTER, Role.ADMIN)
  findAll() {
    // Apenas Masters e Admins podem acessar
  }

  @Post()
  @Roles(Role.MASTER)
  create() {
    // Apenas Masters podem acessar
  }
}
```

### 3. TenantGuard
Injeta o contexto de tenant no request e valida companyId.

```typescript
import { JwtAuthGuard, TenantGuard } from '@/common/guards';
import { CurrentTenant } from '@/common/decorators';

@Controller('companies')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CompaniesController {
  @Get('my-data')
  getMyCompanyData(@CurrentTenant() tenantId: string) {
    // tenantId será null para Masters (acesso global)
    // tenantId será o companyId para outros usuários
  }
}
```

### 4. PermissionsGuard
Valida permissões granulares por módulo.

```typescript
import { JwtAuthGuard, PermissionsGuard } from '@/common/guards';
import { RequirePermission } from '@/common/decorators';
import { ModuleType, Permission } from '@/common/enums';

@Controller('financial')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FinancialController {
  @Get()
  @RequirePermission(ModuleType.FINANCIAL, Permission.READ)
  findAll() {
    // Requer permissão READ no módulo FINANCIAL
  }

  @Post()
  @RequirePermission(ModuleType.FINANCIAL, Permission.WRITE)
  create() {
    // Requer permissão WRITE no módulo FINANCIAL
  }

  @Delete(':id')
  @RequirePermission(ModuleType.FINANCIAL, Permission.ADMIN)
  remove() {
    // Requer permissão ADMIN no módulo FINANCIAL
  }
}
```

## TenantInterceptor

O interceptor adiciona automaticamente o contexto de tenant ao request.

```typescript
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TenantInterceptor } from '@/common/interceptors';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}
```

## Hierarquia de Validação

A ordem de aplicação dos guards é importante:

```typescript
@Controller('example')
@UseGuards(
  JwtAuthGuard,      // 1. Valida JWT e extrai usuário
  TenantGuard,       // 2. Injeta contexto de tenant
  RolesGuard,        // 3. Valida role do usuário
  PermissionsGuard,  // 4. Valida permissões granulares
)
export class ExampleController {}
```

## Decorators Auxiliares

### @CurrentUser()
Extrai o usuário autenticado do request:

```typescript
@Get('profile')
getProfile(@CurrentUser() user: { sub: string; email: string; role: Role; companyId?: string }) {
  return user;
}
```

### @CurrentTenant()
Extrai o tenantId (companyId) do request:

```typescript
@Get('data')
getData(@CurrentTenant() tenantId: string | null) {
  // null para Masters, companyId para outros
}
```

## Hierarquia de Permissões

### Roles
- **MASTER**: Acesso total, sem restrições de tenant
- **ADMIN**: Gerencia sua própria empresa
- **MANAGER**: Acesso limitado definido por permissões
- **CLIENT**: Acesso limitado definido por permissões

### Permissões por Módulo
- **NONE** (0): Sem acesso
- **READ** (1): Apenas leitura
- **WRITE** (2): Leitura + escrita
- **ADMIN** (3): Acesso total ao módulo

A hierarquia é cumulativa: quem tem WRITE também tem READ.

## Exemplos Práticos

### Endpoint apenas para Masters
```typescript
@Get('all-companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MASTER)
getAllCompanies() {
  // Apenas Masters
}
```

### Endpoint para Admin e Manager da mesma empresa
```typescript
@Get('team')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
getTeam(@CurrentTenant() tenantId: string) {
  // Acessa dados apenas da própria empresa
}
```

### Endpoint com permissão granular
```typescript
@Post('invoice')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission(ModuleType.FINANCIAL, Permission.WRITE)
createInvoice(@CurrentUser() user) {
  // Requer permissão WRITE no módulo FINANCIAL
  // Masters passam automaticamente
}
```

## Testes

Todos os guards e o interceptor possuem testes unitários completos:

```bash
npm test -- --testPathPatterns="guards|interceptors"
```

28 testes unitários garantem o funcionamento correto do sistema de autorização.
