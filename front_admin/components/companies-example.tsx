"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Company {
  id: string;
  name: string;
  slug: string;
  cnpj?: string;
  email?: string;
}

/**
 * Exemplo de componente que usa o apiClient para fazer requisições autenticadas
 * Este é um exemplo de como usar o refresh token automaticamente
 */
export default function CompaniesExample() {
  const { data: session, status } = useSession();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCompanies = async () => {
    setLoading(true);
    setError("");
    try {
      // O apiClient automaticamente:
      // 1. Pega o token da sessão
      // 2. Se o token estiver expirado, o NextAuth renova automaticamente via refresh token
      // 3. Adiciona o token no header Authorization
      const data = await apiClient<{ data: Company[] }>("/companies");
      setCompanies(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar empresas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "MASTER") {
      fetchCompanies();
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className='flex justify-center p-8'>
        <Spinner className='h-8 w-8' />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Alert>
        <AlertDescription>
          Você precisa estar autenticado para ver as empresas.
        </AlertDescription>
      </Alert>
    );
  }

  if (session?.user?.role !== "MASTER") {
    return (
      <Alert>
        <AlertDescription>
          Apenas usuários MASTER podem ver todas as empresas.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle>Empresas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Button onClick={fetchCompanies} disabled={loading}>
            {loading ? (
              <>
                <Spinner className='mr-2 h-4 w-4' />
                Carregando...
              </>
            ) : (
              "Recarregar Empresas"
            )}
          </Button>

          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {companies.length === 0 && !loading && !error && (
            <p className='text-muted-foreground'>Nenhuma empresa cadastrada.</p>
          )}

          {companies.length > 0 && (
            <div className='space-y-2'>
              {companies.map((company) => (
                <Card key={company.id}>
                  <CardContent className='p-4'>
                    <h3 className='font-semibold'>{company.name}</h3>
                    <p className='text-sm text-muted-foreground'>
                      Slug: {company.slug}
                    </p>
                    {company.cnpj && (
                      <p className='text-sm text-muted-foreground'>
                        CNPJ: {company.cnpj}
                      </p>
                    )}
                    {company.email && (
                      <p className='text-sm text-muted-foreground'>
                        Email: {company.email}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Sessão</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          <p className='text-sm'>
            <strong>Nome:</strong> {session?.user?.name}
          </p>
          <p className='text-sm'>
            <strong>Email:</strong> {session?.user?.email}
          </p>
          <p className='text-sm'>
            <strong>Role:</strong> {session?.user?.role}
          </p>
          <p className='text-sm break-all'>
            <strong>Access Token (primeiros 50 chars):</strong>{" "}
            {session?.accessToken?.substring(0, 50)}...
          </p>
          <div className='mt-4 p-3 bg-muted rounded text-xs'>
            <p className='font-semibold mb-2'>
              💡 Como funciona o Refresh Token:
            </p>
            <ul className='list-disc list-inside space-y-1'>
              <li>O access token expira após ~1 hora</li>
              <li>
                Quando expira, o NextAuth automaticamente chama /auth/refresh
              </li>
              <li>Um novo access token é gerado e substituído na sessão</li>
              <li>Tudo acontece de forma transparente, sem logout</li>
              <li>Se o refresh token também expirar, o usuário é deslogado</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
