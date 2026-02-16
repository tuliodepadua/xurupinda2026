"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";

interface AdminLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: {
    label: string;
    href?: string;
  }[];
}

export function AdminLayout({ children, breadcrumbs }: AdminLayoutProps) {
  const { status } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Protege a rota
  if (status === "unauthenticated") {
    redirect("/login");
  }

  if (status === "loading") {
    return (
      <div className='flex h-screen items-center justify-center bg-slate-50'>
        <div className='text-center'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent mx-auto mb-4' />
          <p className='text-sm text-slate-600'>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className='lg:pl-64 transition-all duration-300'>
        <Topbar setIsSidebarOpen={setIsSidebarOpen} breadcrumbs={breadcrumbs} />

        <main className='min-h-[calc(100vh-4rem)]'>{children}</main>
      </div>
    </div>
  );
}
