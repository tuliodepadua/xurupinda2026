import { ModuleType, Permission } from '../../../common/enums';

export class ModuleInfoDto {
  id: string;
  name: string;
  slug: string;
  type: ModuleType;
  description?: string | null;
  icon?: string | null;
  order: number;
  isActive: boolean;
}

export class CompanyModuleResponseDto {
  id: string;
  companyId: string;
  moduleId: string;
  isEnabled: boolean;
  defaultPermission: Permission;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  module?: ModuleInfoDto;

  constructor(partial: Partial<CompanyModuleResponseDto>) {
    Object.assign(this, partial);
  }
}
