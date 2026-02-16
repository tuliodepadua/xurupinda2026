import { IsEnum } from 'class-validator';
import { Permission } from '../../../common/enums';

export class UpdatePermissionDto {
  @IsEnum(Permission)
  permission: Permission;
}
