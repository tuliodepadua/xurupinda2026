import { Role } from '../../../common/enums';

export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyId?: string;
  company?: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
