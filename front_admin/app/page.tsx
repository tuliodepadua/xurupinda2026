"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  return (
    <div className='flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black'>
      <main className='flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start'>
        <Image
          className='dark:invert'
          src='/next.svg'
          alt='Next.js logo'
          width={100}
          height={20}
          priority
        />
        <div className='flex flex-col items-center gap-6 text-center sm:items-start sm:text-left'>
          <h1 className='max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50'>
            Xurupinda Admin
          </h1>

          {session ? (
            <Card className='w-full max-w-md'>
              <CardHeader>
                <CardTitle>Bem-vindo, {session.user.name}!</CardTitle>
                <CardDescription>
                  Você está autenticado no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-2'>
                <p className='text-sm text-muted-foreground'>
                  <strong>Email:</strong> {session.user.email}
                </p>
                <p className='text-sm text-muted-foreground'>
                  <strong>Role:</strong> {session.user.role}
                </p>
                {session.user.companyId && (
                  <p className='text-sm text-muted-foreground'>
                    <strong>Company ID:</strong> {session.user.companyId}
                  </p>
                )}
                <div className='flex gap-2 mt-4'>
                  <Link href='/admin' className='flex-1'>
                    <Button className='w-full'>Ir para Dashboard</Button>
                  </Link>
                  <Button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    variant='destructive'
                    className='flex-1'
                  >
                    Sair
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className='max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400'>
              Sistema de administração do Xurupinda. Faça login para acessar o
              painel administrativo.
            </p>
          )}
        </div>
        <div className='flex flex-col gap-4 text-base font-medium sm:flex-row'>
          {!session && !isLoading && (
            <Link href='/login'>
              <Button className='w-full md:w-[158px]'>Fazer Login</Button>
            </Link>
          )}
          {session && (
            <Link href='/admin'>
              <Button className='w-full md:w-[158px]'>Dashboard</Button>
            </Link>
          )}
          {isLoading && (
            <Button disabled className='w-full md:w-[158px]'>
              Carregando...
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
