import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { ModuleType, Permission } from '../../src/common/enums';

describe('ModulesManagement E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: App;

  // Tokens de autenticação
  let masterToken: string;
  let adminToken: string;
  let managerToken: string;

  // IDs dos recursos criados
  let testCompanyId: string;
  let testUserId: string;
  let testCompanyModuleId: string;
  let testUserPermissionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    httpServer = app.getHttpServer();

    // Criar empresa de teste
    const company = await prisma.company.create({
      data: {
        name: 'Test Company Modules',
        slug: 'test-company-modules',
        email: 'modules@test.com',
      },
    });
    testCompanyId = company.id;

    // Criar usuários de teste
    const masterUser = await prisma.user.create({
      data: {
        email: 'master-modules@test.com',
        password:
          '$2b$10$OYXqgrLGHPZm9dvlevEvquvx7MMltM4/KBjN81MFC9fGbR/Y83TwK', // password123
        name: 'Master Modules',
        role: 'MASTER',
        companyId: testCompanyId,
      },
    });

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin-modules@test.com',
        password:
          '$2b$10$OYXqgrLGHPZm9dvlevEvquvx7MMltM4/KBjN81MFC9fGbR/Y83TwK',
        name: 'Admin Modules',
        role: 'ADMIN',
        companyId: testCompanyId,
      },
    });

    const managerUser = await prisma.user.create({
      data: {
        email: 'manager-modules@test.com',
        password:
          '$2b$10$OYXqgrLGHPZm9dvlevEvquvx7MMltM4/KBjN81MFC9fGbR/Y83TwK',
        name: 'Manager Modules',
        role: 'MANAGER',
        companyId: testCompanyId,
      },
    });

    testUserId = managerUser.id;

    // Autenticar usuários
    const masterRes = await request(httpServer)
      .post('/auth/login')
      .send({ email: 'master-modules@test.com', password: 'password123' });
    masterToken = masterRes.body.accessToken;

    const adminRes = await request(httpServer)
      .post('/auth/login')
      .send({ email: 'admin-modules@test.com', password: 'password123' });
    adminToken = adminRes.body.accessToken;

    const managerRes = await request(httpServer)
      .post('/auth/login')
      .send({ email: 'manager-modules@test.com', password: 'password123' });
    managerToken = managerRes.body.accessToken;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.userModulePermission.deleteMany({
      where: { user: { companyId: testCompanyId } },
    });
    await prisma.companyModule.deleteMany({
      where: { companyId: testCompanyId },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { companyId: testCompanyId } },
    });
    await prisma.user.deleteMany({
      where: { companyId: testCompanyId },
    });
    await prisma.company.delete({
      where: { id: testCompanyId },
    });

    await app.close();
  });

  // ==================== MÓDULOS GLOBAIS ====================

  describe('GET /modules/global', () => {
    it('deve listar todos os tipos de módulos (Master)', async () => {
      const response = await request(httpServer)
        .get('/modules/global')
        .set('Authorization', `Bearer ${masterToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toContain(ModuleType.FINANCIAL);
      expect(response.body.data).toContain(ModuleType.SALES);
    });

    it('deve retornar 403 se não for Master', async () => {
      await request(httpServer)
        .get('/modules/global')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('deve retornar 401 sem autenticação', async () => {
      await request(httpServer).get('/modules/global').expect(401);
    });
  });

  // ==================== MÓDULOS POR EMPRESA ====================

  describe('POST /modules/companies/:companyId/enable', () => {
    it('deve habilitar módulo para empresa (Master)', async () => {
      const response = await request(httpServer)
        .post(`/modules/companies/${testCompanyId}/enable`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          moduleType: ModuleType.FINANCIAL,
          defaultPermission: Permission.READ,
          isEnabled: true,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.moduleType).toBe(ModuleType.FINANCIAL);
      expect(response.body.data.defaultPermission).toBe(Permission.READ);
      testCompanyModuleId = response.body.data.id;
    });

    it('deve atualizar módulo existente', async () => {
      const response = await request(httpServer)
        .post(`/modules/companies/${testCompanyId}/enable`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          moduleType: ModuleType.FINANCIAL,
          defaultPermission: Permission.WRITE,
          isEnabled: true,
        })
        .expect(201);

      expect(response.body.data.defaultPermission).toBe(Permission.WRITE);
    });

    it('deve retornar 403 se não for Master', async () => {
      await request(httpServer)
        .post(`/modules/companies/${testCompanyId}/enable`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          moduleType: ModuleType.SALES,
          defaultPermission: Permission.READ,
        })
        .expect(403);
    });

    it('deve retornar 404 se empresa não existir', async () => {
      await request(httpServer)
        .post('/modules/companies/invalid-id/enable')
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          moduleType: ModuleType.SALES,
          defaultPermission: Permission.READ,
        })
        .expect(404);
    });

    it('deve validar DTO (moduleType obrigatório)', async () => {
      await request(httpServer)
        .post(`/modules/companies/${testCompanyId}/enable`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          defaultPermission: Permission.READ,
        })
        .expect(400);
    });
  });

  describe('GET /modules/companies/:companyId', () => {
    it('deve listar módulos da empresa (Master)', async () => {
      const response = await request(httpServer)
        .get(`/modules/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${masterToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('deve listar módulos da própria empresa (Admin)', async () => {
      const response = await request(httpServer)
        .get(`/modules/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('deve retornar 403 se Admin tentar acessar outra empresa', async () => {
      // Criar outra empresa
      const otherCompany = await prisma.company.create({
        data: {
          name: 'Other Company',
          slug: 'other-company-test',
        },
      });

      await request(httpServer)
        .get(`/modules/companies/${otherCompany.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      // Limpar
      await prisma.company.delete({ where: { id: otherCompany.id } });
    });
  });

  describe('PATCH /modules/companies/:companyId/:moduleId', () => {
    it('deve atualizar configurações do módulo (Master)', async () => {
      const response = await request(httpServer)
        .patch(`/modules/companies/${testCompanyId}/${testCompanyModuleId}`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          defaultPermission: Permission.ADMIN,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.defaultPermission).toBe(Permission.ADMIN);
    });

    it('deve retornar 403 se não for Master', async () => {
      await request(httpServer)
        .patch(`/modules/companies/${testCompanyId}/${testCompanyModuleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isEnabled: false,
        })
        .expect(403);
    });

    it('deve retornar 404 se módulo não existir', async () => {
      await request(httpServer)
        .patch(`/modules/companies/${testCompanyId}/invalid-id`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          isEnabled: false,
        })
        .expect(404);
    });
  });

  describe('DELETE /modules/companies/:companyId/disable/:moduleType', () => {
    it('deve desabilitar módulo e aplicar cascata (Master)', async () => {
      // Criar um módulo adicional para testar a desabilitação
      await request(httpServer)
        .post(`/modules/companies/${testCompanyId}/enable`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          moduleType: ModuleType.INVENTORY,
          defaultPermission: Permission.READ,
        });

      const response = await request(httpServer)
        .delete(
          `/modules/companies/${testCompanyId}/disable/${ModuleType.INVENTORY}`,
        )
        .set('Authorization', `Bearer ${masterToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve retornar 404 se módulo não existir', async () => {
      await request(httpServer)
        .delete(
          `/modules/companies/${testCompanyId}/disable/${ModuleType.IMAGES}`,
        )
        .set('Authorization', `Bearer ${masterToken}`)
        .expect(404);
    });

    it('deve retornar 403 se não for Master', async () => {
      await request(httpServer)
        .delete(
          `/modules/companies/${testCompanyId}/disable/${ModuleType.FINANCIAL}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });
  });

  // ==================== PERMISSÕES DE USUÁRIOS ====================

  describe('POST /modules/users/:userId/permissions', () => {
    it('deve atribuir permissão a usuário (Admin)', async () => {
      const response = await request(httpServer)
        .post(`/modules/users/${testUserId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          companyModuleId: testCompanyModuleId,
          permission: Permission.WRITE,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.permission).toBe(Permission.WRITE);
      expect(response.body.data.userId).toBe(testUserId);
      testUserPermissionId = response.body.data.id;
    });

    it('deve atualizar permissão existente ao tentar criar duplicada', async () => {
      // Este teste deve atualizar a mesma permissão criada acima
      const response = await request(httpServer)
        .post(`/modules/users/${testUserId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          companyModuleId: testCompanyModuleId,
          permission: Permission.READ,
        })
        .expect(201);

      expect(response.body.data.permission).toBe(Permission.READ);
      expect(response.body.data.id).toBe(testUserPermissionId); // Mesma permissão
    });

    it('deve permitir Master atribuir permissão', async () => {
      // Master sobrescreve novamente
      const response = await request(httpServer)
        .post(`/modules/users/${testUserId}/permissions`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          companyModuleId: testCompanyModuleId,
          permission: Permission.WRITE,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      // A permissão foi atualizada de volta para WRITE
      expect(response.body.data.permission).toBe(Permission.WRITE);
    });

    it('deve retornar 404 se usuário não existir', async () => {
      await request(httpServer)
        .post('/modules/users/invalid-id/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          companyModuleId: testCompanyModuleId,
          permission: Permission.READ,
        })
        .expect(404);
    });

    it('deve retornar 400 se módulo não está disponível', async () => {
      // Criar módulo que não está habilitado
      const disabledModule = await prisma.companyModule.create({
        data: {
          companyId: testCompanyId,
          moduleType: ModuleType.REPORTS,
          isEnabled: false,
          defaultPermission: Permission.NONE,
        },
      });

      await request(httpServer)
        .post(`/modules/users/${testUserId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          companyModuleId: disabledModule.id,
          permission: Permission.READ,
        })
        .expect(400);

      // Limpar
      await prisma.companyModule.delete({ where: { id: disabledModule.id } });
    });

    it('deve validar DTO (campos obrigatórios)', async () => {
      await request(httpServer)
        .post(`/modules/users/${testUserId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          permission: Permission.READ,
          // faltando companyModuleId
        })
        .expect(400);
    });
  });

  describe('GET /modules/users/:userId/permissions', () => {
    it('deve listar permissões do usuário (Admin)', async () => {
      const response = await request(httpServer)
        .get(`/modules/users/${testUserId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('companyModule');
      expect(response.body.data[0]).toHaveProperty('user');
    });

    it('deve permitir Manager visualizar (dentro da empresa)', async () => {
      const response = await request(httpServer)
        .get(`/modules/users/${testUserId}/permissions`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve permitir Master visualizar qualquer usuário', async () => {
      const response = await request(httpServer)
        .get(`/modules/users/${testUserId}/permissions`)
        .set('Authorization', `Bearer ${masterToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve retornar 404 se usuário não existir', async () => {
      await request(httpServer)
        .get('/modules/users/invalid-id/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /modules/users/:userId/permissions/:permissionId', () => {
    it('deve atualizar permissão de usuário (Admin)', async () => {
      const response = await request(httpServer)
        .patch(
          `/modules/users/${testUserId}/permissions/${testUserPermissionId}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          permission: Permission.ADMIN,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.permission).toBe(Permission.ADMIN);
    });

    it('deve permitir Master atualizar', async () => {
      const response = await request(httpServer)
        .patch(
          `/modules/users/${testUserId}/permissions/${testUserPermissionId}`,
        )
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          permission: Permission.READ,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.permission).toBe(Permission.READ);
    });

    it('deve retornar 403 se Manager tentar atualizar', async () => {
      await request(httpServer)
        .patch(
          `/modules/users/${testUserId}/permissions/${testUserPermissionId}`,
        )
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          permission: Permission.NONE,
        })
        .expect(403);
    });

    it('deve retornar 404 se permissão não existir', async () => {
      await request(httpServer)
        .patch(`/modules/users/${testUserId}/permissions/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          permission: Permission.READ,
        })
        .expect(404);
    });

    it('deve validar DTO (permission obrigatório)', async () => {
      await request(httpServer)
        .patch(
          `/modules/users/${testUserId}/permissions/${testUserPermissionId}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('DELETE /modules/users/:userId/permissions/:permissionId', () => {
    it('deve retornar 404 se permissão não existir', async () => {
      await request(httpServer)
        .delete(`/modules/users/${testUserId}/permissions/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('deve retornar 403 se Manager tentar remover', async () => {
      // Usar a permissão existente (testUserPermissionId)
      await request(httpServer)
        .delete(
          `/modules/users/${testUserId}/permissions/${testUserPermissionId}`,
        )
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);
    });

    it('deve remover permissão de usuário (Admin)', async () => {
      const response = await request(httpServer)
        .delete(
          `/modules/users/${testUserId}/permissions/${testUserPermissionId}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verificar se foi soft-deleted
      const deletedPermission = await prisma.userModulePermission.findUnique({
        where: { id: testUserPermissionId },
      });
      expect(deletedPermission.deletedAt).not.toBeNull();
      expect(deletedPermission.permission).toBe(Permission.NONE);
    });
  });
});
