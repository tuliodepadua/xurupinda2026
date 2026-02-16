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
  companyId: string;
  permissions: UserPermission[];
}
