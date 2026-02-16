# Shadcn/UI - Documentação de Configuração

## Instalação Concluída ✅

O Shadcn/UI foi configurado com sucesso no seu projeto!

## O que foi instalado:

- **57 componentes pré-construídos** em `components/ui/`
- **Configuração do Tailwind CSS** com variáveis CSS
- **Dependências necessárias**:
  - `class-variance-authority`
  - `clsx`
  - `tailwind-merge`
  - `lucide-react` (ícones)

## Estrutura do Projeto

```
your-project/
├── components/
│   └── ui/               # Componentes do Shadcn/UI
├── lib/
│   └── utils.ts          # Utilitários (cn function)
├── app/
│   ├── layout.tsx        # Layout com TooltipProvider
│   └── globals.css       # Estilos globais com variáveis CSS
└── components.json       # Configuração do Shadcn/UI
```

## Como Usar

### 1. Importar um Componente

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Título</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Clique aqui</Button>
      </CardContent>
    </Card>
  )
}
```

### 2. Personalizar com Tailwind CSS

Todos os componentes aceitam props `className` para personalização:

```tsx
<Button className="bg-red-500 hover:bg-red-600">
  Botão Personalizado
</Button>
```

### 3. Adicionar Novos Componentes

Para adicionar componentes adicionais que não foram instalados:

```bash
npx shadcn@latest add <component-name>
```

Exemplos:
```bash
npx shadcn@latest add dialog
npx shadcn@latest add date-picker
npx shadcn@latest add data-table
```

## Componentes Instalados

### Básicos
- Button
- Card
- Input
- Label
- Textarea
- Select
- Checkbox
- Radio Group

### Menus & Navigation
- Dropdown Menu
- Navigation Menu
- Menubar
- Breadcrumb
- Pagination
- Sidebar

### Diálogos & Overlays
- Dialog
- Alert Dialog
- Sheet
- Popover
- Hover Card
- Context Menu
- Tooltip

### Formulários
- Form
- Field
- Input Group
- Input OTP

### Tabelas & Dados
- Table
- Data Table
- Chart
- Skeleton

### Outros
- Badge
- Avatar
- Progress
- Slider
- Switch
- Tabs
- Accordion
- Collapsible
- Carousel
- Combobox
- Command
- Date Picker

## Configuração para Environments

A configuração do Shadcn/UI está em `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

## Documentação Oficial

- **Shadcn/UI**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com
- **Lucide Icons**: https://lucide.dev

## Próximos Passos

1. Explore os componentes disponíveis
2. Customize o tema através das variáveis CSS em `app/globals.css`
3. Comece a usar os componentes nos seus projetos
4. Consulte a documentação oficial para detalhes específicos de cada componente

Aproveite os componentes pré-construídos e de alta qualidade! 🚀
