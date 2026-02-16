import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { Role } from '../../src/common/enums';

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let masterToken: string;
  let adminToken: string;
  let managerToken: string;
  let clientToken: string;
  let testCompanyId: string;
  let createdUserId: string;

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

    // Limpar dados de teste anteriores
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'e2e-master@test.com',
            'e2e-admin@test.com',
            'e2e-manager@test.com',
            'e2e-client@test.com',
            'new-manager@test.com',
            'new-client@test.com',
            'update-test@test.com',
          ],
        },
      },
    });

    await prisma.company.deleteMany({
      where: {
        slug: {
          in: ['e2e-test-company'],
        },
      },
    });

    // Criar empresa de teste
    const company = await prisma.company.create({
      data: {
        name: 'E2E Test Company',
        slug: 'e2e-test-company',
        email: 'e2e-company@test.com',
      },
    });
    testCompanyId = company.id;

    // Criar usuários de teste
    const [masterUser, adminUser, managerUser, clientUser] = await Promise.all([
      prisma.user.create({
        data: {
          email: 'e2e-master@test.com',
          password:
            '$2b$10$OYXqgrLGHPZm9dvlevEvquvx7MMltM4/KBjN81MFC9fGbR/Y83TwK', // password123
          name: 'E2E Master',
          role: Role.MASTER,
          companyId: company.id,
        },
      }),
      prisma.user.create({
        data: {
          email: 'e2e-admin@test.com',
          password:
            '$2b$10$OYXqgrLGHPZm9dvlevEvquvx7MMltM4/KBjN81MFC9fGbR/Y83TwK', // password123
          name: 'E2E Admin',
          role: Role.ADMIN,
          companyId: company.id,
        },
      }),
      prisma.user.create({
        data: {
          email: 'e2e-manager@test.com',
          password:
            '$2b$10$OYXqgrLGHPZm9dvlevEvquvx7MMltM4/KBjN81MFC9fGbR/Y83TwK', // password123
          name: 'E2E Manager',
          role: Role.MANAGER,
          companyId: company.id,
        },
      }),
      prisma.user.create({
        data: {
          email: 'e2e-client@test.com',
          password:
            '$2b$10$OYXqgrLGHPZm9dvlevEvquvx7MMltM4/KBjN81MFC9fGbR/Y83TwK', // password123
          name: 'E2E Client',
          role: Role.CLIENT,
          companyId: company.id,
        },
      }),
    ]);

    // Obter tokens de autenticação
    const [masterRes, adminRes, managerRes, clientRes] = await Promise.all([
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e-master@test.com', password: 'password123' }),
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e-admin@test.com', password: 'password123' }),
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e-manager@test.com', password: 'password123' }),
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e-client@test.com', password: 'password123' }),
    ]);

    masterToken = masterRes.body.accessToken;
    adminToken = adminRes.body.accessToken;
    managerToken = managerRes.body.accessToken;
    clientToken = clientRes.body.accessToken;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'e2e-master@test.com',
            'e2e-admin@test.com',
            'e2e-manager@test.com',
            'e2e-client@test.com',
            'new-manager@test.com',
            'new-client@test.com',
            'update-test@test.com',
          ],
        },
      },
    });

    await prisma.company.deleteMany({
      where: { slug: 'e2e-test-company' },
    });

    await app.close();
  });

  describe('POST /users', () => {
    it('deve criar um MANAGER quando chamado por ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'new-manager@test.com',
          password: 'password123',
          name: 'New Manager',
          role: Role.MANAGER,
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe('new-manager@test.com');
      expect(response.body.data.role).toBe(Role.MANAGER);
      expect(response.body.data.companyId).toBe(testCompanyId);

      createdUserId = response.body.data.id;
    });

    it('deve criar um CLIENT quando chamado por ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'new-client@test.com',
          password: 'password123',
          name: 'New Client',
          role: Role.CLIENT,
        })
        .expect(201);

      expect(response.body.data.role).toBe(Role.CLIENT);
    });

    it('deve retornar 403 se ADMIN tentar criar outro ADMIN', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'another-admin@test.com',
          password: 'password123',
          name: 'Another Admin',
          role: Role.ADMIN,
        })
        .expect(403);
    });

    it('deve retornar 403 se MANAGER tentar criar usuário', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          email: 'should-not-create@test.com',
          password: 'password123',
          name: 'Should Not Create',
          role: Role.CLIENT,
        })
        .expect(403);
    });

    it('deve retornar 403 se CLIENT tentar criar usuário', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          email: 'should-not-create@test.com',
          password: 'password123',
          name: 'Should Not Create',
          role: Role.CLIENT,
        })
        .expect(403);
    });

    it('deve retornar 400 se email já existir', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'new-manager@test.com', // Email já criado
          password: 'password123',
          name: 'Duplicate Email',
          role: Role.MANAGER,
        })
        .expect(400);
    });

    it('deve retornar 400 se dados inválidos', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid-email', // Email inválido
          password: '123', // Senha muito curta
          name: 'AB', // Nome muito curto
          role: Role.MANAGER,
        })
        .expect(400);
    });

    it('MASTER deve poder criar ADMIN com companyId especificado', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          email: 'master-created-admin@test.com',
          password: 'password123',
          name: 'Master Created Admin',
          role: Role.ADMIN,
          companyId: testCompanyId,
        })
        .expect(201);

      expect(response.body.data.role).toBe(Role.ADMIN);
      expect(response.body.data.companyId).toBe(testCompanyId);

      // Limpar
      await prisma.user.delete({
        where: { email: 'master-created-admin@test.com' },
      });
    });
  });

  describe('GET /users', () => {
    it('ADMIN deve ver apenas usuários da sua empresa', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThanOrEqual(4); // Admin, Manager, Client + criados

      // Todos devem ser da mesma empresa
      response.body.data.forEach((user: any) => {
        expect(user.companyId).toBe(testCompanyId);
      });
    });

    it('MANAGER deve ver apenas usuários da sua empresa', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      response.body.data.forEach((user: any) => {
        expect(user.companyId).toBe(testCompanyId);
      });
    });

    it('CLIENT deve ver apenas seu próprio perfil', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].email).toBe('e2e-client@test.com');
    });

    it('deve suportar paginação', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('totalPages');
    });
  });

  describe('GET /users/:id', () => {
    it('ADMIN deve conseguir ver usuário da sua empresa', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(createdUserId);
      expect(response.body.data.email).toBe('new-manager@test.com');
    });

    it('CLIENT deve conseguir ver apenas seu próprio perfil', async () => {
      // Buscar ID do client
      const clientUser = await prisma.user.findUnique({
        where: { email: 'e2e-client@test.com' },
      });

      const response = await request(app.getHttpServer())
        .get(`/users/${clientUser.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.data.email).toBe('e2e-client@test.com');
    });

    it('CLIENT não deve conseguir ver outro usuário', async () => {
      await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });

    it('deve retornar 404 se usuário não existir', async () => {
      await request(app.getHttpServer())
        .get('/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /users/:id', () => {
    it('ADMIN deve conseguir atualizar usuário da sua empresa', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Manager Name',
        })
        .expect(200);

      expect(response.body.data.name).toBe('Updated Manager Name');
    });

    it('deve atualizar senha corretamente', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          password: 'newpassword123',
        })
        .expect(200);

      // Verificar que a senha foi alterada tentando fazer login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'new-manager@test.com',
          password: 'newpassword123',
        })
        .expect(200);

      expect(loginResponse.body.data).toHaveProperty('accessToken');
    });

    it('ADMIN deve conseguir mudar role entre MANAGER e CLIENT', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: Role.CLIENT,
        })
        .expect(200);

      expect(response.body.data.role).toBe(Role.CLIENT);

      // Reverter para MANAGER
      await request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: Role.MANAGER,
        })
        .expect(200);
    });

    it('ADMIN não deve conseguir mudar role para ADMIN ou MASTER', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: Role.ADMIN,
        })
        .expect(403);
    });

    it('CLIENT só deve conseguir atualizar seu próprio perfil', async () => {
      const clientUser = await prisma.user.findUnique({
        where: { email: 'e2e-client@test.com' },
      });

      const response = await request(app.getHttpServer())
        .patch(`/users/${clientUser.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          name: 'Updated Client Name',
        })
        .expect(200);

      expect(response.body.data.name).toBe('Updated Client Name');
    });

    it('CLIENT não deve conseguir atualizar outro usuário', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          name: 'Should Not Update',
        })
        .expect(403);
    });

    it('deve retornar 400 se email já existir', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'e2e-admin@test.com', // Email já existe
        })
        .expect(400);
    });
  });

  describe('DELETE /users/:id', () => {
    it('ADMIN deve conseguir deletar usuário da sua empresa', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Verificar que foi soft-deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: createdUserId },
      });

      expect(deletedUser.deletedAt).not.toBeNull();
    });

    it('não deve permitir deletar a si mesmo', async () => {
      const adminUser = await prisma.user.findUnique({
        where: { email: 'e2e-admin@test.com' },
      });

      await request(app.getHttpServer())
        .delete(`/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('MANAGER não deve conseguir deletar usuários', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);
    });

    it('CLIENT não deve conseguir deletar usuários', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });

  describe('POST /users/:id/restore', () => {
    it('ADMIN deve conseguir restaurar usuário deletado', async () => {
      const response = await request(app.getHttpServer())
        .post(`/users/${createdUserId}/restore`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(response.body.data.id).toBe(createdUserId);

      // Verificar que foi restaurado
      const restoredUser = await prisma.user.findUnique({
        where: { id: createdUserId },
      });

      expect(restoredUser.deletedAt).toBeNull();
    });

    it('MASTER deve conseguir restaurar qualquer usuário', async () => {
      // Deletar novamente
      await prisma.user.update({
        where: { id: createdUserId },
        data: { deletedAt: new Date() },
      });

      const response = await request(app.getHttpServer())
        .post(`/users/${createdUserId}/restore`)
        .set('Authorization', `Bearer ${masterToken}`)
        .expect(201);

      expect(response.body.data.id).toBe(createdUserId);
    });

    it('deve retornar 404 se usuário não estiver deletado', async () => {
      await request(app.getHttpServer())
        .post(`/users/${createdUserId}/restore`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('MANAGER não deve conseguir restaurar usuários', async () => {
      await request(app.getHttpServer())
        .post(`/users/${createdUserId}/restore`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);
    });
  });
});
