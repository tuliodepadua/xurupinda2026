import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-black'>
      <main className='w-full max-w-2xl space-y-8'>
        <div className='flex flex-col items-center gap-4 text-center'>
          <Image
            className='dark:invert'
            src='/next.svg'
            alt='Next.js logo'
            width={100}
            height={20}
            priority
          />
          <h1 className='text-4xl font-bold tracking-tight text-black dark:text-white'>
            Shadcn/UI Instalado com Sucesso! 🎉
          </h1>
          <p className='text-lg text-zinc-600 dark:text-zinc-400'>
            Seu projeto agora está pronto para usar componentes de UI
            reutilizáveis
          </p>
        </div>

        <div className='grid gap-6 md:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Componentes Disponíveis</CardTitle>
              <CardDescription>
                + 50 componentes pré-construídos
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p className='text-sm text-zinc-600 dark:text-zinc-400'>
                Botões, cartões, modais, formulários, tabelas e muito mais!
              </p>
              <Button className='w-full'>Explorar Componentes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tailwind CSS</CardTitle>
              <CardDescription>Personalização com Tailwind</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p className='text-sm text-zinc-600 dark:text-zinc-400'>
                Todos os componentes são totalmente personalizáveis com Tailwind
                CSS
              </p>
              <Button variant='outline' className='w-full'>
                Documentação Tailwind
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className='bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'>
          <CardHeader>
            <CardTitle className='text-blue-900 dark:text-blue-100'>
              Próximos Passos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className='list-inside list-decimal space-y-2 text-sm text-blue-800 dark:text-blue-200'>
              <li>Importe componentes de @/components/ui</li>
              <li>Use-os em suas páginas e componentes</li>
              <li>Personalize com as classes Tailwind CSS</li>
              <li>
                Acesse a documentação em{" "}
                <a href='https://ui.shadcn.com' className='underline'>
                  ui.shadcn.com
                </a>
              </li>
            </ol>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
