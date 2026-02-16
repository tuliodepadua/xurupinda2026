import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  // Credenciais de teste (do seed)
  const testUsers = {
    master: {
      email: 'master@xurupinda.com',
      password: 'master123',
    },
    admin: {
      email: 'admin@democompany.com',
      password: 'admin123',
    },
    manager: {
      email: 'manager@democompany.com',
      password: 'manager123',
    },
    client: {
      email: 'client@democompany.com',
      password: 'client123',
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Aplicar mesmas configurações do main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prisma = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials (Master)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUsers.master)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('tokenType', 'Bearer');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty(
        'email',
        testUsers.master.email,
      );
      expect(response.body.user).toHaveProperty('role', 'MASTER');
      expect(response.body.user.companyId).toBeNull();
    });

    it('should login successfully with valid credentials (Admin)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUsers.admin)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('email', testUsers.admin.email);
      expect(response.body.user).toHaveProperty('role', 'ADMIN');
      expect(response.body.user.companyId).not.toBeNull();
    });

    it('should login successfully with valid credentials (Manager)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUsers.manager)
        .expect(200);

      expect(response.body.user).toHaveProperty('role', 'MANAGER');
    });

    it('should login successfully with valid credentials (Client)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUsers.client)
        .expect(200);

      expect(response.body.user).toHaveProperty('role', 'CLIENT');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Credenciais inválidas');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUsers.master.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Credenciais inválidas');
    });

    it('should fail with missing email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);
    });

    it('should fail with missing password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUsers.master.email,
        })
        .expect(400);
    });

    it('should fail with invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'not-an-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should fail with short password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUsers.master.email,
          password: '12345', // menos de 6 caracteres
        })
        .expect(400);
    });

    it('should fail with extra fields (forbidNonWhitelisted)', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUsers.master.email,
          password: 'password123',
          extraField: 'not-allowed',
        })
        .expect(400);
    });
  });

  describe('POST /auth/refresh', () => {
    let validRefreshToken: string;

    beforeAll(async () => {
      // Fazer login para obter um refresh token válido
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUsers.master);

      validRefreshToken = response.body.refreshToken;
    });

    it('should refresh token successfully with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: validRefreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken', validRefreshToken); // Mesmo refresh token
      expect(response.body).toHaveProperty('tokenType', 'Bearer');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body).toHaveProperty('user');
    });

    it('should fail with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid-token-12345',
        })
        .expect(401);
    });

    it('should fail with missing refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400);
    });

    it('should fail with expired refresh token', async () => {
      // Criar um refresh token expirado manualmente
      const expiredToken = 'expired-token-xyz';

      await prisma.refreshToken.create({
        data: {
          token: expiredToken,
          userId: (await prisma.user.findUnique({
            where: { email: testUsers.master.email },
          }))!.id,
          expiresAt: new Date(Date.now() - 1000), // Expirado há 1 segundo
        },
      });

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: expiredToken,
        })
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    let validRefreshToken: string;

    beforeEach(async () => {
      // Fazer login para obter um refresh token válido
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUsers.admin);

      validRefreshToken = response.body.refreshToken;
    });

    it('should logout successfully with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({
          refreshToken: validRefreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty(
        'message',
        'Logout realizado com sucesso',
      );

      // Verificar se o token foi removido do banco
      const token = await prisma.refreshToken.findUnique({
        where: { token: validRefreshToken },
      });
      expect(token).toBeNull();
    });

    it('should not fail with already logged out token', async () => {
      // Fazer logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({
          refreshToken: validRefreshToken,
        })
        .expect(200);

      // Tentar fazer logout novamente com mesmo token
      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({
          refreshToken: validRefreshToken,
        })
        .expect(200); // Deve retornar sucesso mesmo que token não exista
    });

    it('should fail with missing refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({})
        .expect(400);
    });

    it('should not allow using token after logout', async () => {
      // Fazer logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({
          refreshToken: validRefreshToken,
        })
        .expect(200);

      // Tentar usar o token para refresh
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: validRefreshToken,
        })
        .expect(401);
    });
  });

  describe('Token Integration Flow', () => {
    it('should complete full authentication flow', async () => {
      // 1. Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUsers.manager)
        .expect(200);

      const { accessToken, refreshToken } = loginResponse.body;

      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();

      // 2. Acessar rota protegida com access token
      await request(app.getHttpServer())
        .get('/')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // 3. Refresh token
      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      const newAccessToken = refreshResponse.body.accessToken;
      expect(newAccessToken).toBeDefined();
      // Verifica que o token é válido (pode ser igual se gerado no mesmo segundo)
      expect(typeof newAccessToken).toBe('string');
      expect(newAccessToken.split('.')).toHaveLength(3); // JWT tem 3 partes

      // 4. Usar novo access token
      await request(app.getHttpServer())
        .get('/')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      // 5. Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken })
        .expect(200);

      // 6. Tentar usar refresh token após logout (deve falhar)
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });

    it('should handle multiple concurrent logins for same user', async () => {
      // Fazer login múltiplas vezes
      const login1 = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUsers.client)
        .expect(200);

      const login2 = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUsers.client)
        .expect(200);

      const login3 = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUsers.client)
        .expect(200);

      // Todos os tokens devem ser diferentes
      expect(login1.body.refreshToken).not.toBe(login2.body.refreshToken);
      expect(login2.body.refreshToken).not.toBe(login3.body.refreshToken);
      expect(login1.body.refreshToken).not.toBe(login3.body.refreshToken);

      // Todos devem funcionar
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: login1.body.refreshToken })
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: login2.body.refreshToken })
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: login3.body.refreshToken })
        .expect(200);
    });
  });
});
