import { Permission, ModuleType } from '../../../common/enums';
import { ModuleInfoDto } from './company-module-response.dto';

export class UserPermissionResponseDto {
  id: string;
  userId: string;
  companyModuleId: string;
  permission: Permission;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  companyModule?: {
    id: string;
    moduleId: string;
    moduleType: ModuleType;
    isEnabled: boolean;
    module: ModuleInfoDto;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };

  constructor(partial: Partial<UserPermissionResponseDto>) {
    Object.assign(this, partial);
  }
}
