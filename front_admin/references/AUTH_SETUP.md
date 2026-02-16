# Autenticação com NextAuth e Refresh Token

Este projeto usa NextAuth.js para autenticação integrada com a API Xurupinda, **incluindo suporte completo para refresh token automático**.

## 🔧 Configuração

### Variáveis de Ambiente

Certifique-se de configurar o arquivo `.env.local`:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua-chave-secreta-muito-segura-mude-isso-em-producao
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**IMPORTANTE:** Em produção, gere um secret seguro usando:
```bash
openssl rand -base64 32
```

## 🔄 Sistema de Refresh Token

### Como Funciona

1. **Login Inicial**: Usuário faz login e recebe `accessToken` e `refreshToken`
2. **Token Expira**: Access token expira após ~1 hora (configurável no backend)
3. **Renovação Automática**: NextAuth detecta a expiração e chama `/auth/refresh` automaticamente
4. **Novo Token**: Um novo `accessToken` é gerado e substituído na sessão
5. **Transparente**: Tudo acontece sem intervenção do usuário ou logout forçado

### Arquivos Implementados

#### `lib/auth.ts`
- Configuração principal do NextAuth
- Função `refreshAccessToken()` que chama o endpoint `/auth/refresh`
- Callback JWT que verifica expiração e renova automaticamente
- Callback Session que disponibiliza tokens para o cliente

#### `lib/api-client.ts`  
- Função `apiClient()` para requisições autenticadas em Client Components
- Função `apiClientServer()` para requisições em Server Components
- Adiciona automaticamente o token de acesso nos headers

#### `types/next-auth.d.ts`
- Tipagens TypeScript para sessão e JWT
- Inclui `accessToken`, `refreshToken` e `accessTokenExpires`

## 🚀 Como Usar

### Login

```tsx
import { signIn } from "next-auth/react";

await signIn("credentials", {
  email: "usuario@email.com",
  password: "senha123",
  redirect: false,
});
```

### Fazer Requisições Autenticadas

#### Em Client Components:

```tsx
"use client";

import { apiClient } from "@/lib/api-client";

export default function MyComponent() {
  const fetchData = async () => {
    try {
      // O token é automaticamente renovado se expirado
      const companies = await apiClient("/companies");
      console.log(companies);
    } catch (error) {
      console.error(error);
    }
  };

  return <button onClick={fetchData}>Buscar Empresas</button>;
}
```

#### Em Server Components:

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiClientServer } from "@/lib/api-client";

export default async function MyPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const companies = await apiClientServer(
    "/companies",
    session.accessToken
  );

  return <div>{/* Renderizar dados */}</div>;
}
```

### Acessar Dados da Sessão

```tsx
"use client";

import { useSession } from "next-auth/react";

export default function Profile() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <div>Carregando...</div>;
  if (!session) return <div>Não autenticado</div>;
  
  return (
    <div>
      <p>Nome: {session.user.name}</p>
      <p>Email: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
      <p>Token: {session.accessToken.substring(0, 20)}...</p>
    </div>
  );
}
```

### Logout

```tsx
import { signOut } from "next-auth/react";

<button onClick={() => signOut({ callbackUrl: "/" })}>
  Sair
</button>
```

### Proteger Rotas com Middleware

Crie um arquivo `middleware.ts` na raiz:

```tsx
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/companies/:path*",
  ]
};
```

## 📋 Dados da Sessão

A sessão contém:

```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    role: "MASTER" | "ADMIN" | "MANAGER" | "CLIENT";
    companyId?: string;
  },
  accessToken: string;      // Token JWT para requisições
  refreshToken: string;      // Token para renovação
}
```

## 🔐 Fluxo de Renovação de Token

```
1. Cliente faz requisição → apiClient("/endpoint")
2. NextAuth verifica expiração do token
3. Se expirado:
   ├── Chama refreshAccessToken()
   ├── POST /auth/refresh { refreshToken }
   ├── Backend retorna novo accessToken
   └── Token é atualizado na sessão
4. Requisição prossegue com token válido
```

## 🌐 Endpoints da API Usados

- `POST /auth/login` - Login (retorna accessToken e refreshToken)
- `POST /auth/refresh` - Renovar token (envia refreshToken, retorna novo accessToken)
- `POST /auth/logout` - Logout (invalida refreshToken)

## 📚 Exemplo Completo

Veja o componente de exemplo em `components/companies-example.tsx` que demonstra:
- Uso do `apiClient` com renovação automática
- Tratamento de erros
- Exibição de dados da sessão
- Explicação visual do fluxo de refresh token

## 🔧 Configurações Avançadas

### Tempo de Expiração

No `lib/auth.ts`:

```typescript
session: {
  strategy: "jwt",
  maxAge: 7 * 24 * 60 * 60,    // 7 dias
  updateAge: 24 * 60 * 60,      // Atualizar diariamente
}
```

### Tratamento de Erro na Renovação

Se o refresh token também expirar ou for inválido:
- O usuário é automaticamente deslogado
- Sessão retorna erro "RefreshAccessTokenError"
- Usuário é redirecionado para `/login`

## ✅ Benefícios Implementados

- ✅ Renovação automática do access token
- ✅ Sem logout forçado enquanto refresh token for válido
- ✅ Requisições autenticadas simplificadas  
- ✅ Tipagem TypeScript completa
- ✅ Suporte para Client e Server Components
- ✅ Tratamento de erros robusto
- ✅ Logs de debug para desenvolvimento

## 📝 Notas Importantes

1. **Segurança**: Nunca exponha o `refreshToken` no frontend além da sessão NextAuth
2. **HTTPS**: Use sempre HTTPS em produção
3. **Secret**: Altere `NEXTAUTH_SECRET` para um valor único em produção
4. **Backend**: Certifique-se que a API está retornando `expiresIn` (tempo em segundos)
5. **Logs**: Logs de renovação aparecem no console em desenvolvimento

## 🐛 Troubleshooting

### Token não está sendo renovado

1. Verifique se a API `/auth/refresh` está funcionando
2. Confirme que `refreshToken` está sendo salvo na primeira login
3. Verifique os logs no console do navegador
4. Certifique-se que `NEXT_PUBLIC_API_URL` está correta

### Erro "RefreshAccessTokenError"

- O refresh token expirou ou é inválido
- Usuário precisa fazer login novamente
- Verifique a validade do refresh token no backend
