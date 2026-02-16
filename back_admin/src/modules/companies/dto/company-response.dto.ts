export class CompanyResponseDto {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    users: number;
    companyModules: number;
  };
}
