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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Download,
  Building2,
  Loader2,
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

  // Estados do modal de criação
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Estados do modal de edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyItem | null>(
    null,
  );
  const [editFormData, setEditFormData] = useState({
    email: "",
    phone: "",
  });
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>(
    {},
  );

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

  // Validação do formulário
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Nome é obrigatório";
    }

    if (!formData.slug.trim()) {
      errors.slug = "Slug é obrigatório";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug =
        "Slug deve conter apenas letras minúsculas, números e hífens";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email inválido";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Função para gerar slug automaticamente a partir do nome
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  // Handler de mudança de campo
  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Gera slug automaticamente quando o nome muda
      if (field === "name") {
        updated.slug = generateSlug(value);
      }

      return updated;
    });

    // Limpa erro do campo quando ele é editado
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Criar nova empresa
  const handleCreateCompany = async () => {
    if (!validateForm()) return;

    try {
      setIsCreating(true);

      const response = await apiClient<{ data: Company }>("/companies", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      // Adiciona a nova empresa à lista
      const newCompany: CompanyItem = {
        id: response.data.id,
        name: response.data.name,
        slug: response.data.slug,
        email: response.data.email,
        phone: response.data.phone,
        usersCount: 0,
        modulesCount: 0,
        createdAt: response.data.createdAt,
      };

      setCompanies((prev) => [newCompany, ...prev]);

      // Fecha modal e reseta formulário
      setIsCreateModalOpen(false);
      setFormData({ name: "", slug: "", email: "", phone: "" });
      setFormErrors({});

      // Recarrega a lista para ter dados atualizados
      loadCompanies();
    } catch (error) {
      console.error("Erro ao criar empresa:", error);
      setFormErrors({ general: "Erro ao criar empresa. Tente novamente." });
    } finally {
      setIsCreating(false);
    }
  };

  // Abrir modal de edição
  const handleOpenEditModal = (company: CompanyItem) => {
    setEditingCompany(company);
    setEditFormData({
      email: company.email || "",
      phone: company.phone || "",
    });
    setEditFormErrors({});
    setIsEditModalOpen(true);
  };

  // Handler de mudança de campo de edição
  const handleEditFieldChange = (field: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));

    // Limpa erro do campo quando ele é editado
    if (editFormErrors[field]) {
      setEditFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Validação do formulário de edição
  const validateEditForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (
      editFormData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)
    ) {
      errors.email = "Email inválido";
    }

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Atualizar empresa
  const handleUpdateCompany = async () => {
    if (!validateEditForm() || !editingCompany) return;

    try {
      setIsEditing(true);

      const response = await apiClient<{ data: Company }>(
        `/companies/${editingCompany.id}`,
        {
          method: "PATCH",
          body: JSON.stringify(editFormData),
        },
      );

      // Atualiza a empresa na lista
      setCompanies((prev) =>
        prev.map((company) =>
          company.id === editingCompany.id
            ? {
                ...company,
                email: response.data.email,
                phone: response.data.phone,
              }
            : company,
        ),
      );

      // Fecha modal e reseta
      setIsEditModalOpen(false);
      setEditingCompany(null);
      setEditFormData({ email: "", phone: "" });
      setEditFormErrors({});
    } catch (error) {
      console.error("Erro ao atualizar empresa:", error);
      setEditFormErrors({
        general: "Erro ao atualizar empresa. Tente novamente.",
      });
    } finally {
      setIsEditing(false);
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
      <div className='p-4 lg:p-8 space-y-6'>
        {loading && (
          <div className='fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center'>
            <div className='bg-white rounded-lg p-6 shadow-xl'>
              <div className='flex items-center gap-3'>
                <div className='animate-spin h-5 w-5 border-2 border-slate-900 border-t-transparent rounded-full' />
                <span className='text-slate-700'>Carregando empresas...</span>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight text-slate-900'>
              Gerenciamento de Empresas
            </h1>
            <p className='text-slate-500 mt-1'>
              Visualize e gerencie todas as empresas do sistema
            </p>
          </div>
          <Button
            className='gap-2 bg-slate-900 hover:bg-slate-800'
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className='h-4 w-4' />
            Nova Empresa
          </Button>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='pb-3'>
              <CardDescription>Total de Empresas</CardDescription>
              <CardTitle className='text-3xl'>{companies.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-xs text-slate-500'>Cadastradas no sistema</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-3'>
              <CardDescription>Usuários Totais</CardDescription>
              <CardTitle className='text-3xl'>
                {companies.reduce((acc, c) => acc + (c.usersCount || 0), 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-xs text-slate-500'>Entre todas empresas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-3'>
              <CardDescription>Módulos Ativos</CardDescription>
              <CardTitle className='text-3xl'>
                {companies.reduce((acc, c) => acc + (c.modulesCount || 0), 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-xs text-slate-500'>Habilitados no total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-3'>
              <CardDescription>Novas Este Mês</CardDescription>
              <CardTitle className='text-3xl'>3</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-xs text-slate-500'>Empresas cadastradas</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Card */}
        <Card className='border-slate-200'>
          <CardHeader>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <CardTitle>Lista de Empresas</CardTitle>
                <CardDescription className='mt-1'>
                  {filteredData.length} empresa(s) encontrada(s)
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
                  placeholder='Buscar por nome, slug ou email...'
                  className='pl-10 bg-slate-50 border-slate-200 focus:bg-white'
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
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
                        Empresa
                      </TableHead>
                      <TableHead className='font-semibold text-slate-700'>
                        Contato
                      </TableHead>
                      <TableHead className='font-semibold text-slate-700'>
                        Usuários
                      </TableHead>
                      <TableHead className='font-semibold text-slate-700'>
                        Módulos
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
                          colSpan={6}
                          className='h-32 text-center text-slate-500'
                        >
                          Nenhuma empresa encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((company) => (
                        <TableRow
                          key={company.id}
                          className='hover:bg-slate-50 transition-colors cursor-pointer'
                          onClick={() => router.push(`/admin/${company.slug}`)}
                        >
                          <TableCell>
                            <div className='flex items-center gap-3'>
                              <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white'>
                                <Building2 className='h-5 w-5' />
                              </div>
                              <div>
                                <p className='font-medium text-slate-900'>
                                  {company.name}
                                </p>
                                <p className='text-sm text-slate-500'>
                                  /{company.slug}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {company.email && (
                                <p className='text-sm text-slate-700'>
                                  {company.email}
                                </p>
                              )}
                              {company.phone && (
                                <p className='text-sm text-slate-500'>
                                  {company.phone}
                                </p>
                              )}
                              {!company.email && !company.phone && (
                                <span className='text-sm text-slate-400'>
                                  Não informado
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant='outline' className='font-normal'>
                              {company.usersCount || 0} usuários
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant='outline' className='font-normal'>
                              {company.modulesCount || 0} módulos
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className='text-sm text-slate-700'>
                              {new Date(company.createdAt).toLocaleDateString(
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
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className='h-4 w-4' />
                                  <span className='sr-only'>Abrir menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end'>
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/admin/${company.slug}`);
                                  }}
                                >
                                  <Eye className='mr-2 h-4 w-4' />
                                  Acessar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditModal(company);
                                  }}
                                >
                                  <Edit className='mr-2 h-4 w-4' />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className='text-red-600 focus:text-red-600 focus:bg-red-50'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: implementar exclusão
                                  }}
                                >
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

      {/* Modal de Criação de Empresa */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className='sm:max-w-125'>
          <DialogHeader>
            <DialogTitle>Nova Empresa</DialogTitle>
            <DialogDescription>
              Adicione uma nova empresa ao sistema. Os campos marcados com * são
              obrigatórios.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            {formErrors.general && (
              <div className='rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200'>
                {formErrors.general}
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='name'>
                Nome da Empresa <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='name'
                placeholder='Ex: Tech Solutions Ltda'
                value={formData.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className='text-sm text-red-600'>{formErrors.name}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='slug'>
                Slug <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='slug'
                placeholder='Ex: tech-solutions'
                value={formData.slug}
                onChange={(e) => handleFieldChange("slug", e.target.value)}
                className={formErrors.slug ? "border-red-500" : ""}
              />
              <p className='text-xs text-slate-500'>
                URL amigável para a empresa. Use apenas letras minúsculas,
                números e hífens.
              </p>
              {formErrors.slug && (
                <p className='text-sm text-red-600'>{formErrors.slug}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='contato@empresa.com'
                value={formData.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                className={formErrors.email ? "border-red-500" : ""}
              />
              {formErrors.email && (
                <p className='text-sm text-red-600'>{formErrors.email}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='phone'>Telefone</Label>
              <Input
                id='phone'
                type='tel'
                placeholder='(11) 98765-4321'
                value={formData.phone}
                onChange={(e) => handleFieldChange("phone", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setIsCreateModalOpen(false);
                setFormData({ name: "", slug: "", email: "", phone: "" });
                setFormErrors({});
              }}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCompany}
              disabled={isCreating}
              className='bg-slate-900 hover:bg-slate-800'
            >
              {isCreating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className='mr-2 h-4 w-4' />
                  Criar Empresa
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Empresa */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className='sm:max-w-125'>
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>
              Atualize as informações de contato da empresa{" "}
              {editingCompany?.name}. Nome e slug não podem ser alterados.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            {editFormErrors.general && (
              <div className='rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200'>
                {editFormErrors.general}
              </div>
            )}

            {/* Campos não editáveis - apenas visualização */}
            <div className='space-y-2'>
              <Label htmlFor='edit-name'>Nome da Empresa</Label>
              <Input
                id='edit-name'
                value={editingCompany?.name || ""}
                disabled
                className='bg-slate-50 cursor-not-allowed'
              />
              <p className='text-xs text-slate-500'>
                O nome da empresa não pode ser alterado.
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit-slug'>Slug</Label>
              <Input
                id='edit-slug'
                value={editingCompany?.slug || ""}
                disabled
                className='bg-slate-50 cursor-not-allowed'
              />
              <p className='text-xs text-slate-500'>
                O slug da empresa não pode ser alterado.
              </p>
            </div>

            {/* Campos editáveis */}
            <div className='space-y-2'>
              <Label htmlFor='edit-email'>Email</Label>
              <Input
                id='edit-email'
                type='email'
                placeholder='contato@empresa.com'
                value={editFormData.email}
                onChange={(e) => handleEditFieldChange("email", e.target.value)}
                className={editFormErrors.email ? "border-red-500" : ""}
              />
              {editFormErrors.email && (
                <p className='text-sm text-red-600'>{editFormErrors.email}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit-phone'>Telefone</Label>
              <Input
                id='edit-phone'
                type='tel'
                placeholder='(11) 98765-4321'
                value={editFormData.phone}
                onChange={(e) => handleEditFieldChange("phone", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingCompany(null);
                setEditFormData({ email: "", phone: "" });
                setEditFormErrors({});
              }}
              disabled={isEditing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateCompany}
              disabled={isEditing}
              className='bg-slate-900 hover:bg-slate-800'
            >
              {isEditing ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Salvando...
                </>
              ) : (
                <>
                  <Edit className='mr-2 h-4 w-4' />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
