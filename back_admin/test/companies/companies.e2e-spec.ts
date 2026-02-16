import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';

describe('CompaniesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let masterToken: string;
  let adminToken: string;
  let testCompanyId: string;

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

    // Fazer login como Master
    const masterLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'master@xurupinda.com',
        password: 'master123',
      });
    masterToken = masterLogin.body.accessToken;

    // Fazer login como Admin
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@democompany.com',
        password: 'admin123',
      });
    adminToken = adminLogin.body.accessToken;
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (testCompanyId) {
      await prisma.company
        .delete({ where: { id: testCompanyId } })
        .catch(() => {});
    }

    await app.close();
  });

  describe('POST /companies', () => {
    it('deve criar uma empresa como Master', async () => {
      const response = await request(app.getHttpServer())
        .post('/companies')
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          name: 'E2E Test Company',
          slug: 'e2e-test-company',
          email: 'e2e@test.com',
          phone: '1234567890',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('E2E Test Company');
      expect(response.body.data.slug).toBe('e2e-test-company');

      testCompanyId = response.body.data.id;
    });

    it('deve rejeitar criação sem autenticação', async () => {
      await request(app.getHttpServer())
        .post('/companies')
        .send({
          name: 'Test Company',
          slug: 'test-company',
        })
        .expect(401);
    });

    it('deve rejeitar criação por Admin', async () => {
      await request(app.getHttpServer())
        .post('/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Company',
          slug: 'test-company-2',
        })
        .expect(403);
    });

    it('deve rejeitar slug inválido', async () => {
      const response = await request(app.getHttpServer())
        .post('/companies')
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          name: 'Test Company',
          slug: 'Invalid Slug!',
        })
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Slug deve conter apenas'),
        ]),
      );
    });

    it('deve rejeitar slug duplicado', async () => {
      const response = await request(app.getHttpServer())
        .post('/companies')
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          name: 'Another Company',
          slug: 'e2e-test-company',
        })
        .expect(409);

      expect(response.body.message).toContain('já existe');
    });
  });

  describe('GET /companies', () => {
    it('deve listar empresas como Master', async () => {
      const response = await request(app.getHttpServer())
        .get('/companies')
        .set('Authorization', `Bearer ${masterToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('meta');
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.meta).toHaveProperty('total');
      expect(response.body.data.meta).toHaveProperty('page');
    });

    it('deve rejeitar listagem por Admin', async () => {
      await request(app.getHttpServer())
        .get('/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('deve respeitar paginação', async () => {
      const response = await request(app.getHttpServer())
        .get('/companies?page=1&limit=5')
        .set('Authorization', `Bearer ${masterToken}`)
        .expect(200);

      expect(response.body.data.meta.page).toBe(1);
      expect(response.body.data.meta.limit).toBe(5);
    });
  });

  describe('GET /companies/:id', () => {
    it('deve buscar empresa por ID como Master', async () => {
      const response = await request(app.getHttpServer())
        .get(`/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${masterToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testCompanyId);
    });

    it('deve retornar 404 para ID inexistente', async () => {
      await request(app.getHttpServer())
        .get('/companies/invalid-id-999')
        .set('Authorization', `Bearer ${masterToken}`)
        .expect(404);
    });
  });

  describe('GET /companies/slug/:slug', () => {
    it('deve buscar empresa por slug', async () => {
      const response = await request(app.getHttpServer())
        .get('/companies/slug/e2e-test-company')
        .set('Authorization', `Bearer ${masterToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('e2e-test-company');
    });

    it('deve retornar 404 para slug inexistente', async () => {
      await request(app.getHttpServer())
        .get('/companies/slug/invalid-slug-xyz')
        .set('Authorization', `Bearer ${masterToken}`)
        .expect(404);
    });
  });

  describe('PATCH /companies/:id', () => {
    it('deve atualizar empresa como Master', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          name: 'Updated E2E Company',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated E2E Company');
    });

    it('deve rejeitar atualização por Admin', async () => {
      await request(app.getHttpServer())
        .patch(`/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Hacked Name',
        })
        .expect(403);
    });

    it('deve rejeitar slug duplicado na atualização', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${masterToken}`)
        .send({
          slug: 'demo-company',
        })
        .expect(409);

      expect(response.body.message).toContain('já existe');
    });
  });

  describe('DELETE /companies/:id', () => {
    it('deve rejeitar deleção por Admin', async () => {
      await request(app.getHttpServer())
        .delete(`/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('deve rejeitar deleção de empresa com usuários ativos', async () => {
      // Demo Company tem usuários ativos
      const demoCompany = await prisma.company.findFirst({
        where: { slug: 'demo-company' },
      });

      await request(app.getHttpServer())
        .delete(`/companies/${demoCompany.id}`)
        .set('Authorization', `Bearer ${masterToken}`)
        .expect(400);
    });

    it('deve deletar empresa sem usuários como Master', async () => {
      await request(app.getHttpServer())
        .delete(`/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${masterToken}`)
        .expect(204);

      // Verificar se foi soft-deleted
      const deletedCompany = await prisma.company.findUnique({
        where: { id: testCompanyId },
      });

      expect(deletedCompany.deletedAt).not.toBeNull();
    });
  });

  describe('PATCH /companies/:id/restore', () => {
    it('deve restaurar empresa deletada', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/companies/${testCompanyId}/restore`)
        .set('Authorization', `Bearer ${masterToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testCompanyId);

      // Verificar se foi restaurada
      const restoredCompany = await prisma.company.findUnique({
        where: { id: testCompanyId },
      });

      expect(restoredCompany.deletedAt).toBeNull();
    });

    it('deve rejeitar restauração de empresa não deletada', async () => {
      await request(app.getHttpServer())
        .patch(`/companies/${testCompanyId}/restore`)
        .set('Authorization', `Bearer ${masterToken}`)
        .expect(400);
    });
  });
});
