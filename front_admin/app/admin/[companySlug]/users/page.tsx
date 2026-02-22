"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
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
  Filter,
  UserPlus,
  Loader2,
  Shield,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { User, Role } from "@/types";

// Interface para dados da tabela de usuários
interface UserItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export default function CompanyUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const companySlug = params.companySlug as string;

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estado para armazenar o ID da empresa atual
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);

  // Estados do modal de criação
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "CLIENT" as Role,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Estados do modal de edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    role: "CLIENT" as Role,
  });
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>(
    {},
  );

  // Estados do modal de exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);

  // Carrega o ID da empresa baseado no slug
  const loadCompanyId = async () => {
    try {
      const response = await apiClient<{ data: { id: string } }>(
        `/companies/slug/${companySlug}`,
      );
      setCurrentCompanyId(response.data.id);
    } catch (error) {
      console.error("Erro ao carregar empresa:", error);
    }
  };

  // Carrega usuários da API
  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/login");
      return;
    }

    loadCompanyId();
    loadUsers();
  }, [session, status, router, companySlug]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient<{ data: User[] }>("/users");

      // Mapeia para o formato da tabela
      const mappedUsers: UserItem[] = response.data.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  // Validação do formulário de criação
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Nome é obrigatório";
    }

    if (!formData.email.trim()) {
      errors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email inválido";
    }

    if (!formData.password.trim()) {
      errors.password = "Senha é obrigatória";
    } else if (formData.password.length < 6) {
      errors.password = "Senha deve ter no mínimo 6 caracteres";
    }

    if (!formData.role) {
      errors.role = "Role é obrigatória";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler de mudança de campo
  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpa erro do campo quando ele é editado
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Criar novo usuário
  const handleCreateUser = async () => {
    if (!validateForm()) return;

    try {
      setIsCreating(true);

      // Prepara os dados para envio
      const createUserData: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      // Se o usuário logado for MASTER e estiver criando um usuário que não seja MASTER,
      // é necessário enviar o companyId
      if (
        session?.user?.role === "MASTER" &&
        formData.role !== "MASTER" &&
        currentCompanyId
      ) {
        createUserData.companyId = currentCompanyId;
      }

      const response = await apiClient<{ data: User }>("/users", {
        method: "POST",
        body: JSON.stringify(createUserData),
      });

      const newUser: UserItem = {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
        isActive: response.data.isActive,
        createdAt: response.data.createdAt,
      };

      setUsers((prev) => [newUser, ...prev]);
      setIsCreateModalOpen(false);
      setFormData({ name: "", email: "", password: "", role: "CLIENT" });
      setFormErrors({});
      loadUsers();
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      setFormErrors({ general: "Erro ao criar usuário. Tente novamente." });
    } finally {
      setIsCreating(false);
    }
  };

  // Abrir modal de edição
  const handleOpenEditModal = (user: UserItem) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setEditFormErrors({});
    setIsEditModalOpen(true);
  };

  // Handler de mudança de campo de edição
  const handleEditFieldChange = (field: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));

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

    if (!editFormData.name.trim()) {
      errors.name = "Nome é obrigatório";
    }

    if (!editFormData.email.trim()) {
      errors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      errors.email = "Email inválido";
    }

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Atualizar usuário
  const handleUpdateUser = async () => {
    if (!validateEditForm() || !editingUser) return;

    try {
      setIsEditing(true);

      const response = await apiClient<{ data: User }>(
        `/users/${editingUser.id}`,
        {
          method: "PATCH",
          body: JSON.stringify(editFormData),
        },
      );

      setUsers((prev) =>
        prev.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                name: response.data.name,
                email: response.data.email,
                role: response.data.role,
              }
            : user,
        ),
      );

      setIsEditModalOpen(false);
      setEditingUser(null);
      setEditFormData({ name: "", email: "", role: "CLIENT" });
      setEditFormErrors({});
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      setEditFormErrors({
        general: "Erro ao atualizar usuário. Tente novamente.",
      });
    } finally {
      setIsEditing(false);
    }
  };

  // Abrir modal de exclusão
  const handleOpenDeleteModal = (user: UserItem) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  // Excluir usuário
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleting(true);

      await apiClient(`/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      setUsers((prev) => prev.filter((user) => user.id !== userToDelete.id));
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrar dados
  const filteredData = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Paginação
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Helper para obter cor do badge de role
  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case "MASTER":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "ADMIN":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "MANAGER":
        return "bg-green-100 text-green-800 border-green-200";
      case "CLIENT":
        return "bg-slate-100 text-slate-800 border-slate-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // Helper para traduzir roles
  const translateRole = (role: Role) => {
    switch (role) {
      case "MASTER":
        return "Master";
      case "ADMIN":
        return "Administrador";
      case "MANAGER":
        return "Gerente";
      case "CLIENT":
        return "Cliente";
      default:
        return role;
    }
  };

  // Verificar permissões do usuário
  const canCreateUser =
    session?.user?.role === "MASTER" || session?.user?.role === "ADMIN";
  const canEditUser =
    session?.user?.role === "MASTER" || session?.user?.role === "ADMIN";
  const canDeleteUser =
    session?.user?.role === "MASTER" || session?.user?.role === "ADMIN";

  return (
    <AdminLayout>
      <div className='p-4 lg:p-8 space-y-6'>
        {loading && (
          <div className='fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center'>
            <div className='bg-white rounded-lg p-6 shadow-xl'>
              <div className='flex items-center gap-3'>
                <div className='animate-spin h-5 w-5 border-2 border-slate-900 border-t-transparent rounded-full' />
                <span className='text-slate-700'>Carregando usuários...</span>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight text-slate-900'>
              Usuários da Empresa
            </h1>
            <p className='text-slate-500 mt-1'>
              Gerencie os usuários e permissões desta empresa
            </p>
          </div>
          {canCreateUser && (
            <Button
              className='gap-2 bg-slate-900 hover:bg-slate-800'
              onClick={() => setIsCreateModalOpen(true)}
            >
              <UserPlus className='h-4 w-4' />
              Novo Usuário
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='pb-3'>
              <CardDescription>Total de Usuários</CardDescription>
              <CardTitle className='text-3xl'>{users.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-xs text-slate-500'>Cadastrados na empresa</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-3'>
              <CardDescription>Administradores</CardDescription>
              <CardTitle className='text-3xl'>
                {users.filter((u) => u.role === "ADMIN").length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-xs text-slate-500'>Com acesso total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-3'>
              <CardDescription>Gerentes</CardDescription>
              <CardTitle className='text-3xl'>
                {users.filter((u) => u.role === "MANAGER").length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-xs text-slate-500'>Acesso intermediário</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-3'>
              <CardDescription>Clientes</CardDescription>
              <CardTitle className='text-3xl'>
                {users.filter((u) => u.role === "CLIENT").length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-xs text-slate-500'>Usuários finais</p>
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
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className='w-full sm:w-50 bg-slate-50 border-slate-200'>
                  <Filter className='mr-2 h-4 w-4' />
                  <SelectValue placeholder='Filtrar por role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todas as roles</SelectItem>
                  <SelectItem value='ADMIN'>Administrador</SelectItem>
                  <SelectItem value='MANAGER'>Gerente</SelectItem>
                  <SelectItem value='CLIENT'>Cliente</SelectItem>
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
                      paginatedData.map((user) => (
                        <TableRow
                          key={user.id}
                          className='hover:bg-slate-50 transition-colors'
                        >
                          <TableCell>
                            <div className='flex items-center gap-3'>
                              <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white font-semibold'>
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className='font-medium text-slate-900'>
                                  {user.name}
                                </p>
                                <p className='text-sm text-slate-500'>
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant='outline'
                              className={`font-normal ${getRoleBadgeColor(user.role)}`}
                            >
                              <Shield className='mr-1 h-3 w-3' />
                              {translateRole(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant='outline'
                              className={
                                user.isActive
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-red-100 text-red-800 border-red-200"
                              }
                            >
                              {user.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className='text-sm text-slate-700'>
                              {new Date(user.createdAt).toLocaleDateString(
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
                                <DropdownMenuItem
                                  onClick={() => {
                                    // TODO: ver detalhes do usuário
                                  }}
                                >
                                  <Eye className='mr-2 h-4 w-4' />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                {canEditUser && (
                                  <DropdownMenuItem
                                    onClick={() => handleOpenEditModal(user)}
                                  >
                                    <Edit className='mr-2 h-4 w-4' />
                                    Editar
                                  </DropdownMenuItem>
                                )}
                                {canDeleteUser && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className='text-red-600 focus:text-red-600 focus:bg-red-50'
                                      onClick={() =>
                                        handleOpenDeleteModal(user)
                                      }
                                    >
                                      <Trash2 className='mr-2 h-4 w-4' />
                                      Excluir
                                    </DropdownMenuItem>
                                  </>
                                )}
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

      {/* Modal de Criação de Usuário */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className='sm:max-w-125'>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Adicione um novo usuário à empresa. Os campos marcados com * são
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
                Nome Completo <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='name'
                placeholder='Ex: João Silva'
                value={formData.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className='text-sm text-red-600'>{formErrors.name}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email'>
                Email <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='email'
                type='email'
                placeholder='usuario@email.com'
                value={formData.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                className={formErrors.email ? "border-red-500" : ""}
              />
              {formErrors.email && (
                <p className='text-sm text-red-600'>{formErrors.email}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>
                Senha <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='password'
                type='password'
                placeholder='Mínimo 6 caracteres'
                value={formData.password}
                onChange={(e) => handleFieldChange("password", e.target.value)}
                className={formErrors.password ? "border-red-500" : ""}
              />
              {formErrors.password && (
                <p className='text-sm text-red-600'>{formErrors.password}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='role'>
                Nível de Acesso <span className='text-red-500'>*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value: Role) =>
                  handleFieldChange("role", value)
                }
              >
                <SelectTrigger
                  id='role'
                  className={formErrors.role ? "border-red-500" : ""}
                >
                  <SelectValue placeholder='Selecione o nível' />
                </SelectTrigger>
                <SelectContent>
                  {session?.user?.role === "MASTER" && (
                    <SelectItem value='ADMIN'>Administrador</SelectItem>
                  )}
                  <SelectItem value='MANAGER'>Gerente</SelectItem>
                  <SelectItem value='CLIENT'>Cliente</SelectItem>
                </SelectContent>
              </Select>
              <p className='text-xs text-slate-500'>
                Define as permissões e acessos do usuário no sistema
              </p>
              {formErrors.role && (
                <p className='text-sm text-red-600'>{formErrors.role}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setIsCreateModalOpen(false);
                setFormData({
                  name: "",
                  email: "",
                  password: "",
                  role: "CLIENT",
                });
                setFormErrors({});
              }}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateUser}
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
                  <UserPlus className='mr-2 h-4 w-4' />
                  Criar Usuário
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Usuário */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className='sm:max-w-125'>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário {editingUser?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            {editFormErrors.general && (
              <div className='rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200'>
                {editFormErrors.general}
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='edit-name'>
                Nome Completo <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='edit-name'
                placeholder='Ex: João Silva'
                value={editFormData.name}
                onChange={(e) => handleEditFieldChange("name", e.target.value)}
                className={editFormErrors.name ? "border-red-500" : ""}
              />
              {editFormErrors.name && (
                <p className='text-sm text-red-600'>{editFormErrors.name}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit-email'>
                Email <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='edit-email'
                type='email'
                placeholder='usuario@email.com'
                value={editFormData.email}
                onChange={(e) => handleEditFieldChange("email", e.target.value)}
                className={editFormErrors.email ? "border-red-500" : ""}
              />
              {editFormErrors.email && (
                <p className='text-sm text-red-600'>{editFormErrors.email}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit-role'>
                Nível de Acesso <span className='text-red-500'>*</span>
              </Label>
              <Select
                value={editFormData.role}
                onValueChange={(value: Role) =>
                  handleEditFieldChange("role", value)
                }
              >
                <SelectTrigger id='edit-role'>
                  <SelectValue placeholder='Selecione o nível' />
                </SelectTrigger>
                <SelectContent>
                  {session?.user?.role === "MASTER" && (
                    <SelectItem value='ADMIN'>Administrador</SelectItem>
                  )}
                  <SelectItem value='MANAGER'>Gerente</SelectItem>
                  <SelectItem value='CLIENT'>Cliente</SelectItem>
                </SelectContent>
              </Select>
              <p className='text-xs text-slate-500'>
                Define as permissões e acessos do usuário no sistema
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingUser(null);
                setEditFormData({ name: "", email: "", role: "CLIENT" });
                setEditFormErrors({});
              }}
              disabled={isEditing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateUser}
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

      {/* Modal de Exclusão de Usuário */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className='sm:max-w-125'>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o usuário{" "}
              <span className='font-semibold text-slate-900'>
                {userToDelete?.name}
              </span>
              ? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className='rounded-lg bg-amber-50 p-4 border border-amber-200 mt-4'>
            <p className='text-sm text-amber-800'>
              <strong>Atenção:</strong> O usuário será permanentemente removido
              do sistema e perderá acesso a todos os recursos.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className='bg-red-600 hover:bg-red-700 text-white'
            >
              {isDeleting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className='mr-2 h-4 w-4' />
                  Confirmar Exclusão
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
