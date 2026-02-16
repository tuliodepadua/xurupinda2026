import { PrismaClient, Role, ModuleType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

// Configurar pool do PostgreSQL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Hash da senha padrão para usuário master
  const hashedPassword = await bcrypt.hash('master123', 10);

  // 1. Criar módulos globais do sistema
  const modulesData = [
    {
      name: 'Gestão de Usuários',
      slug: 'user-management',
      type: ModuleType.USER_MANAGEMENT,
      description: 'Gerenciamento de usuários e permissões',
      icon: 'users',
      order: 1,
    },
    {
      name: 'Financeiro',
      slug: 'financial',
      type: ModuleType.FINANCIAL,
      description: 'Controle financeiro e fluxo de caixa',
      icon: 'dollar-sign',
      order: 2,
    },
    {
      name: 'Estoque',
      slug: 'inventory',
      type: ModuleType.INVENTORY,
      description: 'Controle de inventário e produtos',
      icon: 'package',
      order: 3,
    },
    {
      name: 'Vendas',
      slug: 'sales',
      type: ModuleType.SALES,
      description: 'Gestão de vendas e pedidos',
      icon: 'shopping-cart',
      order: 4,
    },
    {
      name: 'Agendamentos',
      slug: 'schedules',
      type: ModuleType.SCHEDULES,
      description: 'Gestão de agendamentos e calendário',
      icon: 'calendar',
      order: 5,
    },
    {
      name: 'Relatórios',
      slug: 'reports',
      type: ModuleType.REPORTS,
      description: 'Relatórios e análises',
      icon: 'bar-chart',
      order: 6,
    },
    {
      name: 'Galeria de Imagens',
      slug: 'images',
      type: ModuleType.IMAGES,
      description: 'Gerenciamento de imagens e mídia',
      icon: 'image',
      order: 7,
    },
    {
      name: 'Configurações',
      slug: 'settings',
      type: ModuleType.SETTINGS,
      description: 'Configurações gerais do sistema',
      icon: 'settings',
      order: 8,
    },
  ];

  const createdModules: { [key: string]: any } = {};

  for (const moduleData of modulesData) {
    const module = await prisma.module.upsert({
      where: { type: moduleData.type },
      update: {},
      create: moduleData,
    });
    createdModules[moduleData.type] = module;
    console.log(`✅ Module created: ${module.name}`);
  }

  // 2. Criar usuário MASTER (não precisa de company)
  const masterUser = await prisma.user.upsert({
    where: { email: 'master@xurupinda.com' },
    update: {},
    create: {
      email: 'master@xurupinda.com',
      password: hashedPassword,
      name: 'Master User',
      role: Role.MASTER,
      companyId: null, // Master não tem empresa
    },
  });

  console.log('✅ Master user created:', masterUser.email);

  // 3. Criar empresa de exemplo
  const demoCompany = await prisma.company.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo-company',
      email: 'contato@democompany.com',
      phone: '(11) 98765-4321',
    },
  });

  console.log('✅ Demo company created:', demoCompany.name);

  // 4. Criar usuário ADMIN para empresa demo
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@democompany.com' },
    update: {},
    create: {
      email: 'admin@democompany.com',
      password: adminPassword,
      name: 'Admin User',
      role: Role.ADMIN,
      companyId: demoCompany.id,
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // 5. Habilitar todos os módulos para a empresa demo
  for (const moduleType of Object.keys(createdModules)) {
    await prisma.companyModule.upsert({
      where: {
        company_module_unique: {
          companyId: demoCompany.id,
          moduleId: createdModules[moduleType].id,
        },
      },
      update: {},
      create: {
        companyId: demoCompany.id,
        moduleId: createdModules[moduleType].id,
        isEnabled: true,
        defaultPermission: 'READ',
      },
    });
  }

  console.log('✅ All modules enabled for demo company');

  // 6. Criar usuário MANAGER de exemplo
  const managerPassword = await bcrypt.hash('manager123', 10);
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@democompany.com' },
    update: {},
    create: {
      email: 'manager@democompany.com',
      password: managerPassword,
      name: 'Manager User',
      role: Role.MANAGER,
      companyId: demoCompany.id,
    },
  });

  console.log('✅ Manager user created:', managerUser.email);

  // 7. Criar usuário CLIENT de exemplo
  const clientPassword = await bcrypt.hash('client123', 10);
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@democompany.com' },
    update: {},
    create: {
      email: 'client@democompany.com',
      password: clientPassword,
      name: 'Client User',
      role: Role.CLIENT,
      companyId: demoCompany.id,
    },
  });

  console.log('✅ Client user created:', clientUser.email);

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📝 Credentials created:');
  console.log('-----------------------------------');
  console.log('Master: master@xurupinda.com / master123');
  console.log('Admin:  admin@democompany.com / admin123');
  console.log('Manager: manager@democompany.com / manager123');
  console.log('Client: client@democompany.com / client123');
  console.log('-----------------------------------\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
