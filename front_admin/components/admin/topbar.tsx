"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Menu, Search, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { signOut } from "next-auth/react";

interface TopbarProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
  breadcrumbs?: {
    label: string;
    href?: string;
  }[];
}

export function Topbar({ setIsSidebarOpen, breadcrumbs = [] }: TopbarProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className='sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-8'>
      {/* Mobile Menu Button */}
      <Button
        variant='ghost'
        size='icon'
        className='lg:hidden'
        onClick={() => setIsSidebarOpen(true)}
      >
        <Menu className='h-5 w-5' />
      </Button>

      {/* Breadcrumbs */}
      <div className='hidden lg:flex'>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href='/admin'>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className='flex items-center gap-2'>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink href={crumb.href}>
                      {crumb.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Search Bar */}
      <div className='flex-1 max-w-md lg:max-w-lg ml-auto'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
          <Input
            type='search'
            placeholder='Buscar...'
            className='w-full pl-10 bg-slate-50 border-slate-200 focus:bg-white'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Notifications */}
      <Button variant='ghost' size='icon' className='relative'>
        <Bell className='h-5 w-5' />
        <span className='absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500' />
      </Button>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='flex items-center gap-2 px-3 py-2 h-auto'
          >
            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-semibold'>
              {session?.user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className='hidden lg:flex flex-col items-start'>
              <span className='text-sm font-medium text-slate-900'>
                {session?.user?.name || "Usuário"}
              </span>
              <span className='text-xs text-slate-500'>
                {session?.user?.role || "USER"}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-56'>
          <DropdownMenuLabel>
            <div className='flex flex-col'>
              <span className='font-semibold'>{session?.user?.name}</span>
              <span className='text-xs font-normal text-slate-500'>
                {session?.user?.email}
              </span>
              {session?.user?.role && (
                <Badge variant='secondary' className='w-fit mt-1'>
                  {session.user.role}
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className='mr-2 h-4 w-4' />
            Meu Perfil
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Search className='mr-2 h-4 w-4' />
            Preferências
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/" })}
            className='text-red-600 focus:text-red-600 focus:bg-red-50'
          >
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
