import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Permission } from '../../../common/enums';

export class EnableModuleForCompanyDto {
  @IsString()
  moduleId: string;

  @IsOptional()
  @IsEnum(Permission)
  defaultPermission?: Permission = Permission.NONE;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean = true;
}
