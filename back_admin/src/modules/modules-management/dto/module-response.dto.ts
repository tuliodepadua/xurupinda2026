import { ModuleType } from '../../../common/enums';

export class ModuleResponseDto {
  id: string;
  name: string;
  slug: string;
  type: ModuleType;
  description?: string | null;
  icon?: string | null;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ModuleResponseDto>) {
    Object.assign(this, partial);
  }
}
