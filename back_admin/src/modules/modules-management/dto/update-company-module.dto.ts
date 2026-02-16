import { IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Permission } from '../../../common/enums';

export class UpdateCompanyModuleDto {
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsEnum(Permission)
  defaultPermission?: Permission;
}
