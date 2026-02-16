import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Função para renovar o access token usando o refresh token
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    if (!token.refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();

    return {
      ...token,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || token.refreshToken,
      accessTokenExpires: Date.now() + (data.expiresIn || 3600) * 1000,
    };
  } catch (error) {
    console.error("Token refresh error:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "seu@email.com" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }

        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Falha na autenticação");
          }

          const data = await response.json();

          // Assumindo que a API retorna algo como:
          // { user: { id, email, name, role, companyId }, accessToken, refreshToken }
          if (data.accessToken) {
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
              companyId: data.user.companyId,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              accessTokenExpires: Date.now() + (data.expiresIn || 3600) * 1000,
            };
          }

          return null;
        } catch (error) {
          console.error("Erro no login:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Usuário faz login pela primeira vez
      if (user) {
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpires: user.accessTokenExpires,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: user.companyId,
          },
        };
      }

      // Token ainda é válido
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Token expirou, tenta renovar automaticamente
      console.log("Access token expirado, renovando...");
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Verifica se houve erro na renovação do token
      if (token.error === "RefreshAccessTokenError") {
        // Força o usuário a fazer login novamente
        throw new Error("Sessão expirada");
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: token.user?.id,
          email: token.user?.email,
          name: token.user?.name,
          role: token.user?.role,
          companyId: token.user?.companyId,
        },
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
      };
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 dias
    updateAge: 24 * 60 * 60, // Atualizar a sessão diariamente
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
};
