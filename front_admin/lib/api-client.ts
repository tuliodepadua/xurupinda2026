import { getSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Cliente HTTP para fazer requisições autenticadas à API
 * Automaticamente inclui o token de acesso no header Authorization
 *
 * @param endpoint - O endpoint da API (ex: "/companies", "/users")
 * @param options - Opções do fetch
 * @returns Promise com os dados da resposta
 *
 * @example
 * ```ts
 * // GET request
 * const companies = await apiClient("/companies");
 *
 * // POST request
 * const newUser = await apiClient("/users", {
 *   method: "POST",
 *   body: JSON.stringify({ name: "João", email: "joao@email.com" })
 * });
 *
 * // PATCH request
 * const updated = await apiClient("/users/123", {
 *   method: "PATCH",
 *   body: JSON.stringify({ name: "João Silva" })
 * });
 * ```
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const session = await getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Adiciona o token de acesso se estiver disponível
  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = "Erro na requisição";
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
    } catch {
      errorMessage = `${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  // Se não houver conteúdo, retorna null
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

/**
 * Cliente HTTP para uso em Server Components
 * Requer que o token seja passado manualmente
 *
 * @param endpoint - O endpoint da API
 * @param accessToken - Token de acesso JWT
 * @param options - Opções do fetch
 * @returns Promise com os dados da resposta
 *
 * @example
 * ```ts
 * import { getServerSession } from "next-auth";
 * import { authOptions } from "@/lib/auth";
 *
 * const session = await getServerSession(authOptions);
 * const data = await apiClientServer("/companies", session.accessToken);
 * ```
 */
export async function apiClientServer<T = unknown>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    ...(options.headers as Record<string, string>),
  };

  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = "Erro na requisição";
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
    } catch {
      errorMessage = `${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  // Se não houver conteúdo, retorna null
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}
