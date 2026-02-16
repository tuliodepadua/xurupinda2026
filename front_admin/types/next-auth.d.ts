import "next-auth";
import "next-auth/jwt";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: "MASTER" | "ADMIN" | "MANAGER" | "CLIENT";
  companyId?: string;
  companySlug?: string;
  companies?: string[]; // Array de IDs de companies
}

declare module "next-auth" {
  interface Session {
    user: UserData;
    accessToken: string;
    refreshToken: string;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: "MASTER" | "ADMIN" | "MANAGER" | "CLIENT";
    companyId?: string;
    companySlug?: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: UserData;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    error?: string;
  }
}
