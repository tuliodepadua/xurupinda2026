"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Download,
  Building2,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { Company } from "@/types";

// Interface para dados da tabela de companies
interface CompanyItem {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  usersCount?: number;
  modulesCount?: number;
  createdAt: string;
}

// Dados mockados para exemplo - será substituído por dados reais da API
const mockCompanies: CompanyItem[] = [
  {
    id: "1",
    name: "Tech Solutions Ltda",
    slug: "tech-solutions",
    email: "contato@techsolutions.com",
    phone: "(11) 98765-4321",
    usersCount: 45,
    modulesCount: 6,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Comercial Santos",
    slug: "comercial-santos",
    email: "info@comercialsantos.com.br",
    phone: "(21) 3456-7890",
    usersCount: 28,
    modulesCount: 4,
    createdAt: "2024-01-20",
  },
  {
    id: "3",
    name: "Indústria Oliveira",
    slug: "industria-oliveira",
    email: "contato@oliveira.ind.br",
    phone: "(19) 2345-6789",
    usersCount: 112,
    modulesCount: 8,
    createdAt: "2024-02-01",
  },
  {
    id: "4",
    name: "Serviços Costa",
    slug: "servicos-costa",
    email: "atendimento@servicoscosta.com",
    phone: "(85) 98888-1234",
    usersCount: 15,
    modulesCount: 3,
    createdAt: "2024-02-05",
  },
  {
    id: "5",
    name: "Logística Mendes",
    slug: "logistica-mendes",
    email: "comercial@logisticamendes.com.br",
    phone: "(11) 4567-8901",
    usersCount: 73,
    modulesCount: 5,
    createdAt: "2024-02-10",
  },
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyItem[]>(mockCompanies);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Lógica de redirecionamento baseada em role e companies
  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/login");
      return;
    }

    const user = session.user;

    // Se não for MASTER e tiver apenas uma company, redireciona
    if (user.role !== "MASTER" && user.companyId) {
      // Se tiver companySlug, redireciona diretamente
      if (user.companySlug) {
        router.push(`/admin/${user.companySlug}`);
        return;
      }

      // Fallback: Verifica se tem companies array ou apenas companyId
      const userCompanies =
        user.companies || (user.companyId ? [user.companyId] : []);

      if (userCompanies.length === 1) {
        // Redireciona para a página específica da company
        router.push(`/admin/${userCompanies[0]}`);
        return;
      }
    }

    // MASTER ou usuários com múltiplas companies veem a lista
    loadCompanies();
  }, [session, status, router]);

  // Carrega companies da API
  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await apiClient<{ data: { data: Company[] } }>(
        "/companies",
      );

      // Mapeia para o formato da tabela
      const mappedCompanies: CompanyItem[] = response.data.data.map(
        (company) => ({
          id: company.id,
          name: company.name,
          slug: company.slug,
          email: company.email,
          phone: company.phone,
          usersCount: 0, // TODO: buscar contagem real da API
          modulesCount: 0, // TODO: buscar contagem real da API
          createdAt: company.createdAt,
        }),
      );

      setCompanies(mappedCompanies);
    } catch (error) {
      console.error("Erro ao carregar companies:", error);
      // Mantém os dados mockados em caso de erro
    } finally {
      setLoading(false);
    }
  };

  // Filtrar dados
  const filteredData = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (company.email &&
        company.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Paginação
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <AdminLayout>
      <div className='p-4 lg:p-8 space-y-6'>Dashboard</div>
    </AdminLayout>
  );
}
