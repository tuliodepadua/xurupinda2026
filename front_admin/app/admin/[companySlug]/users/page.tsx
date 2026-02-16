"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Download,
  Filter,
} from "lucide-react";

// Dados mockados para exemplo
interface DataItem {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive" | "pending";
  role: string;
  createdAt: string;
  avatar?: string;
}

const mockData: DataItem[] = [
  {
    id: "1",
    name: "João Silva",
    email: "joao.silva@email.com",
    status: "active",
    role: "Admin",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria.santos@email.com",
    status: "active",
    role: "Manager",
    createdAt: "2024-01-20",
  },
  {
    id: "3",
    name: "Pedro Oliveira",
    email: "pedro.oliveira@email.com",
    status: "pending",
    role: "User",
    createdAt: "2024-02-01",
  },
  {
    id: "4",
    name: "Ana Costa",
    email: "ana.costa@email.com",
    status: "active",
    role: "Manager",
    createdAt: "2024-02-05",
  },
  {
    id: "5",
    name: "Carlos Mendes",
    email: "carlos.mendes@email.com",
    status: "inactive",
    role: "User",
    createdAt: "2024-02-10",
  },
];

const statusConfig = {
  active: {
    label: "Ativo",
    variant: "default" as const,
    className: "bg-green-500 hover:bg-green-600",
  },
  inactive: {
    label: "Inativo",
    variant: "secondary" as const,
    className: "bg-slate-400",
  },
  pending: {
    label: "Pendente",
    variant: "outline" as const,
    className: "bg-yellow-500 hover:bg-yellow-600 text-white",
  },
};

export default function AdminPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filtrar dados
  const filteredData = mockData.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
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
      <div className='p-4 lg:p-8 space-y-6'>
        {/* Header */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight text-slate-900'>
              Gerenciamento de Usuários
            </h1>
            <p className='text-slate-500 mt-1'>
              Visualize e gerencie todos os usuários do sistema
            </p>
          </div>
          <Button className='gap-2 bg-slate-900 hover:bg-slate-800'>
            <Plus className='h-4 w-4' />
            Novo Registro
          </Button>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='pb-3'>
              <CardDescription>Total de Usuários</CardDescription>
              <CardTitle className='text-3xl'>127</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-xs text-slate-500'>+12% do mês anterior</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-3'>
              <CardDescription>Usuários Ativos</CardDescription>
              <CardTitle className='text-3xl'>98</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-xs text-slate-500'>77% do total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-3'>
              <CardDescription>Pendentes</CardDescription>
              <CardTitle className='text-3xl'>15</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-xs text-slate-500'>Aguardando aprovação</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-3'>
              <CardDescription>Novos Hoje</CardDescription>
              <CardTitle className='text-3xl'>8</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-xs text-slate-500'>+4 desde ontem</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Card */}
        <Card className='border-slate-200'>
          <CardHeader>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <CardTitle>Lista de Usuários</CardTitle>
                <CardDescription className='mt-1'>
                  {filteredData.length} usuário(s) encontrado(s)
                </CardDescription>
              </div>
              <Button variant='outline' className='gap-2'>
                <Download className='h-4 w-4' />
                Exportar
              </Button>
            </div>

            {/* Filters */}
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center mt-6'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                <Input
                  placeholder='Buscar por nome ou email...'
                  className='pl-10 bg-slate-50 border-slate-200 focus:bg-white'
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className='w-full sm:w-48'>
                  <Filter className='h-4 w-4 mr-2' />
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos os Status</SelectItem>
                  <SelectItem value='active'>Ativo</SelectItem>
                  <SelectItem value='pending'>Pendente</SelectItem>
                  <SelectItem value='inactive'>Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            {/* Table */}
            <div className='rounded-lg border border-slate-200 overflow-hidden'>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow className='bg-slate-50 hover:bg-slate-50'>
                      <TableHead className='font-semibold text-slate-700'>
                        Usuário
                      </TableHead>
                      <TableHead className='font-semibold text-slate-700'>
                        Role
                      </TableHead>
                      <TableHead className='font-semibold text-slate-700'>
                        Status
                      </TableHead>
                      <TableHead className='font-semibold text-slate-700'>
                        Data de Criação
                      </TableHead>
                      <TableHead className='text-right font-semibold text-slate-700'>
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className='h-32 text-center text-slate-500'
                        >
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((item) => (
                        <TableRow
                          key={item.id}
                          className='hover:bg-slate-50 transition-colors'
                        >
                          <TableCell>
                            <div className='flex items-center gap-3'>
                              <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white font-semibold'>
                                {item.name.charAt(0)}
                              </div>
                              <div>
                                <p className='font-medium text-slate-900'>
                                  {item.name}
                                </p>
                                <p className='text-sm text-slate-500'>
                                  {item.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className='text-sm text-slate-700'>
                              {item.role}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={statusConfig[item.status].variant}
                              className={statusConfig[item.status].className}
                            >
                              {statusConfig[item.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className='text-sm text-slate-700'>
                              {new Date(item.createdAt).toLocaleDateString(
                                "pt-BR",
                              )}
                            </span>
                          </TableCell>
                          <TableCell className='text-right'>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='h-8 w-8'
                                >
                                  <MoreVertical className='h-4 w-4' />
                                  <span className='sr-only'>Abrir menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end'>
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Eye className='mr-2 h-4 w-4' />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className='mr-2 h-4 w-4' />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className='text-red-600 focus:text-red-600 focus:bg-red-50'>
                                  <Trash2 className='mr-2 h-4 w-4' />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination */}
            {filteredData.length > itemsPerPage && (
              <div className='flex items-center justify-between mt-4'>
                <p className='text-sm text-slate-500'>
                  Mostrando {startIndex + 1} a{" "}
                  {Math.min(startIndex + itemsPerPage, filteredData.length)} de{" "}
                  {filteredData.length} resultados
                </p>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <div className='flex items-center gap-1'>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size='sm'
                          className={
                            currentPage === page
                              ? "bg-slate-900 hover:bg-slate-800"
                              : ""
                          }
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ),
                    )}
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
