"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Building2,
  Users,
  Package,
  Settings,
  LogOut,
  X,
  ChevronLeft,
  LayoutDashboard,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

// Menu items para gestão global
const globalMenuItems = [
  { icon: Home, label: "Dashboard", href: "/admin" },
  { icon: Building2, label: "Empresas", href: "/admin/companies" },
  { icon: Users, label: "Usuários", href: "/admin/users" },
  { icon: Package, label: "Módulos", href: "/admin/modules" },
  { icon: Settings, label: "Configurações", href: "/admin/settings" },
];

// Menu items para gestão de empresa específica
const companyMenuItems = (companySlug: string) => [
  { icon: LayoutDashboard, label: "Dashboard", href: `/admin/${companySlug}` },
  { icon: Users, label: "Usuários", href: `/admin/${companySlug}/users` },
  { icon: Package, label: "Módulos", href: `/admin/${companySlug}/modules` },
  {
    icon: Settings,
    label: "Configurações",
    href: `/admin/${companySlug}/settings`,
  },
];

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Detectar se estamos em contexto de empresa específica
  const companySlugMatch = pathname.match(/^\/admin\/([^\/]+)(?:\/|$)/);
  const isGlobalRoute =
    !companySlugMatch ||
    ["companies", "users", "modules", "settings"].includes(companySlugMatch[1]);
  const companySlug = !isGlobalRoute ? companySlugMatch[1] : null;

  // Selecionar menu items baseado no contexto
  const menuItems = companySlug
    ? companyMenuItems(companySlug)
    : globalMenuItems;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className='fixed inset-0 z-40 bg-black/50 lg:hidden'
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-white border-r border-slate-200 transition-all duration-300 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        {/* Header */}
        <div className='flex h-16 items-center justify-between border-b border-slate-200 px-4'>
          {!isCollapsed && (
            <Link href='/admin' className='flex items-center gap-2'>
              <LayoutDashboard className='h-6 w-6 text-slate-900' />
              <span className='font-semibold text-lg text-slate-900'>
                Xurupinda
              </span>
            </Link>
          )}
          <Button
            variant='ghost'
            size='icon'
            className='lg:flex hidden'
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5 transition-transform",
                isCollapsed && "rotate-180",
              )}
            />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='lg:hidden'
            onClick={() => setIsOpen(false)}
          >
            <X className='h-5 w-5' />
          </Button>
        </div>

        {/* Company Context Header */}
        {companySlug && !isCollapsed && (
          <div className='border-b border-slate-200 p-3'>
            <Link
              href='/admin/companies'
              className='flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors'
            >
              <ArrowLeft className='h-4 w-4' />
              <span>Voltar para gestão global</span>
            </Link>
            <div className='mt-2 flex items-center gap-2'>
              <Building2 className='h-5 w-5 text-slate-700' />
              <div>
                <p className='text-xs text-slate-500'>Empresa</p>
                <p className='text-sm font-semibold text-slate-900 capitalize'>
                  {companySlug.replace(/-/g, " ")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className='flex-1 space-y-1 p-3 overflow-y-auto'>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className='h-5 w-5 shrink-0' />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer - User Info */}
        <div className='border-t border-slate-200 p-3'>
          {session?.user && (
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5",
                isCollapsed && "justify-center",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-semibold",
                )}
              >
                {session.user.name?.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className='flex-1 overflow-hidden'>
                  <p className='text-sm font-medium text-slate-900 truncate'>
                    {session.user.name}
                  </p>
                  <p className='text-xs text-slate-500 truncate'>
                    {session.user.role}
                  </p>
                </div>
              )}
            </div>
          )}
          <Button
            variant='ghost'
            className={cn(
              "w-full mt-2 text-slate-700 hover:text-red-600 hover:bg-red-50",
              isCollapsed ? "px-0" : "justify-start",
            )}
            onClick={() => signOut({ callbackUrl: "/" })}
            title={isCollapsed ? "Sair" : undefined}
          >
            <LogOut className='h-5 w-5 shrink-0' />
            {!isCollapsed && <span className='ml-3'>Sair</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
