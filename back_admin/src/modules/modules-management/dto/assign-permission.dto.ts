import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Permission } from '../../../common/enums';

export class AssignPermissionDto {
  @IsString()
  @IsNotEmpty()
  companyModuleId: string;

  @IsEnum(Permission)
  permission: Permission;
}
