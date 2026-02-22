export enum Role {
  MASTER = "MASTER",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  CLIENT = "CLIENT",
}

export enum PermissionLevel {
  NONE = "NONE",
  READ = "READ",
  WRITE = "WRITE",
  ADMIN = "ADMIN",
}

export interface UserPermission {
  module: string; // ModuleType enum do backend
  level: PermissionLevel;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId?: string; // Opcional para MASTER
  companies?: string[]; // Array de IDs de companies (para futuro suporte multi-company)
  permissions: UserPermission[];
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId?: string;
  companyName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
