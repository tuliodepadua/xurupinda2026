import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../database/prisma.service';
import { Role } from '../../common/enums';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock do bcrypt
jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    company: {
      findFirst: jest.fn(),
    },
  };

  const mockMasterUser = {
    id: 'master-id',
    email: 'master@test.com',
    name: 'Master User',
    role: Role.MASTER,
    companyId: 'company-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockAdminUser = {
    id: 'admin-id',
    email: 'admin@test.com',
    name: 'Admin User',
    role: Role.ADMIN,
    companyId: 'company-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockManagerUser = {
    id: 'manager-id',
    email: 'manager@test.com',
    name: 'Manager User',
    role: Role.MANAGER,
    companyId: 'company-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockClientUser = {
    id: 'client-id',
    email: 'client@test.com',
    name: 'Client User',
    role: Role.CLIENT,
    companyId: 'company-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockCompany = {
    id: 'company-1',
    name: 'Test Company',
    slug: 'test-company',
    email: 'company@test.com',
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
  });

  describe('create', () => {
    it('deve criar um usuário ADMIN quando chamado por MASTER', async () => {
      const createDto = {
        email: 'newadmin@test.com',
        password: 'password123',
        name: 'New Admin',
        role: Role.ADMIN,
        companyId: 'company-1',
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockMasterUser);
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null); // Email não existe
      mockPrismaService.company.findFirst.mockResolvedValue(mockCompany);
      mockPrismaService.user.create.mockResolvedValue({
        ...createDto,
        id: 'new-admin-id',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        company: mockCompany,
      });

      const result = await service.create(createDto, mockMasterUser.id);

      expect(result.email).toBe(createDto.email);
      expect(result.role).toBe(Role.ADMIN);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: createDto.email,
            name: createDto.name,
            role: Role.ADMIN,
            companyId: 'company-1',
          }),
        }),
      );
    });

    it('deve criar um MANAGER quando chamado por ADMIN', async () => {
      const createDto = {
        email: 'newmanager@test.com',
        password: 'password123',
        name: 'New Manager',
        role: Role.MANAGER,
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockAdminUser);
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...createDto,
        id: 'new-manager-id',
        password: 'hashed-password',
        companyId: mockAdminUser.companyId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        company: mockCompany,
      });

      const result = await service.create(createDto, mockAdminUser.id);

      expect(result.email).toBe(createDto.email);
      expect(result.companyId).toBe(mockAdminUser.companyId);
      expect(result.role).toBe(Role.MANAGER);
    });

    it('deve lançar erro se ADMIN tentar criar outro ADMIN', async () => {
      const createDto = {
        email: 'newadmin@test.com',
        password: 'password123',
        name: 'New Admin',
        role: Role.ADMIN,
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockAdminUser);
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null); // Email não existe

      await expect(service.create(createDto, mockAdminUser.id)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve lançar erro se MANAGER tentar criar usuário', async () => {
      const createDto = {
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New User',
        role: Role.CLIENT,
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockManagerUser);
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null); // Email não existe

      await expect(
        service.create(createDto, mockManagerUser.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar erro se email já existir', async () => {
      const createDto = {
        email: 'existing@test.com',
        password: 'password123',
        name: 'New User',
        role: Role.CLIENT,
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockAdminUser);
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockClientUser); // Email existe

      await expect(service.create(createDto, mockAdminUser.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar erro se ADMIN tentar criar usuário de outra empresa', async () => {
      const createDto = {
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New User',
        role: Role.MANAGER,
        companyId: 'other-company',
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockAdminUser);
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.create(createDto, mockAdminUser.id)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findAll', () => {
    it('MASTER deve ver todos os usuários', async () => {
      const paginationDto = { page: 1, limit: 10 };
      const users = [mockMasterUser, mockAdminUser, mockManagerUser];

      mockPrismaService.user.findUnique.mockResolvedValue(mockMasterUser);
      mockPrismaService.user.findMany.mockResolvedValue(
        users.map((u) => ({ ...u, company: mockCompany })),
      );
      mockPrismaService.user.count.mockResolvedValue(3);

      const result = await service.findAll(paginationDto, mockMasterUser.id);

      expect(result.data.length).toBe(3);
      expect(result.meta.totalItems).toBe(3);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
        }),
      );
    });

    it('ADMIN deve ver apenas usuários da sua empresa', async () => {
      const paginationDto = { page: 1, limit: 10 };
      const users = [mockAdminUser, mockManagerUser];

      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrismaService.user.findMany.mockResolvedValue(
        users.map((u) => ({ ...u, company: mockCompany })),
      );
      mockPrismaService.user.count.mockResolvedValue(2);

      const result = await service.findAll(paginationDto, mockAdminUser.id);

      expect(result.data.length).toBe(2);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, companyId: mockAdminUser.companyId },
        }),
      );
    });

    it('CLIENT deve ver apenas seu próprio perfil', async () => {
      const paginationDto = { page: 1, limit: 10 };

      mockPrismaService.user.findUnique.mockResolvedValue(mockClientUser);
      mockPrismaService.user.findMany.mockResolvedValue([
        { ...mockClientUser, company: mockCompany },
      ]);
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await service.findAll(paginationDto, mockClientUser.id);

      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe(mockClientUser.id);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, id: mockClientUser.id },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar usuário se tiver permissão', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrismaService.user.findFirst.mockResolvedValue({
        ...mockManagerUser,
        company: mockCompany,
      });

      const result = await service.findOne(
        mockManagerUser.id,
        mockAdminUser.id,
      );

      expect(result.id).toBe(mockManagerUser.id);
    });

    it('deve lançar erro se usuário não existir', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('invalid-id', mockAdminUser.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar erro se ADMIN tentar acessar usuário de outra empresa', async () => {
      const otherCompanyUser = {
        ...mockManagerUser,
        companyId: 'other-company',
        company: mockCompany,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrismaService.user.findFirst.mockResolvedValue(otherCompanyUser);

      await expect(
        service.findOne(mockManagerUser.id, mockAdminUser.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('deve atualizar usuário com permissão', async () => {
      const updateDto = { name: 'Updated Name' };

      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrismaService.user.findFirst.mockResolvedValue(mockManagerUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockManagerUser,
        ...updateDto,
        company: mockCompany,
      });

      const result = await service.update(
        mockManagerUser.id,
        updateDto,
        mockAdminUser.id,
      );

      expect(result.name).toBe(updateDto.name);
    });

    it('deve fazer hash da senha se fornecida', async () => {
      const updateDto = { password: 'newpassword123' };

      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrismaService.user.findFirst.mockResolvedValue(mockManagerUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockManagerUser,
        password: 'hashed-password',
        company: mockCompany,
      });

      await service.update(mockManagerUser.id, updateDto, mockAdminUser.id);

      expect(bcrypt.hash).toHaveBeenCalledWith(updateDto.password, 10);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'hashed-password',
          }),
        }),
      );
    });

    it('deve lançar erro se tentar atualizar email para um já existente', async () => {
      const updateDto = { email: 'existing@test.com' };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockAdminUser);
      mockPrismaService.user.findFirst.mockResolvedValueOnce(mockManagerUser);
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockClientUser); // Email existe

      await expect(
        service.update(mockManagerUser.id, updateDto, mockAdminUser.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro se ADMIN tentar mudar role para MASTER', async () => {
      const updateDto = { role: Role.MASTER };

      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrismaService.user.findFirst.mockResolvedValue(mockManagerUser);

      await expect(
        service.update(mockManagerUser.id, updateDto, mockAdminUser.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('deve deletar usuário com permissão', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrismaService.user.findFirst.mockResolvedValue(mockManagerUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockManagerUser,
        deletedAt: new Date(),
      });

      await service.remove(mockManagerUser.id, mockAdminUser.id);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockManagerUser.id },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('deve lançar erro se tentar deletar a si mesmo', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);

      await expect(
        service.remove(mockAdminUser.id, mockAdminUser.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro se ADMIN tentar deletar outro ADMIN', async () => {
      const otherAdmin = { ...mockAdminUser, id: 'other-admin-id' };

      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrismaService.user.findFirst.mockResolvedValue(otherAdmin);

      await expect(
        service.remove(otherAdmin.id, mockAdminUser.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('restore', () => {
    it('deve restaurar usuário deletado', async () => {
      const deletedUser = { ...mockManagerUser, deletedAt: new Date() };

      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrismaService.user.findFirst
        .mockResolvedValueOnce(deletedUser)
        .mockResolvedValueOnce(null); // Email disponível
      mockPrismaService.user.update.mockResolvedValue({
        ...mockManagerUser,
        company: mockCompany,
      });

      const result = await service.restore(
        mockManagerUser.id,
        mockAdminUser.id,
      );

      expect(result.id).toBe(mockManagerUser.id);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockManagerUser.id },
        data: { deletedAt: null },
        include: expect.any(Object),
      });
    });

    it('deve lançar erro se email já estiver em uso', async () => {
      const deletedUser = { ...mockManagerUser, deletedAt: new Date() };

      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrismaService.user.findFirst
        .mockResolvedValueOnce(deletedUser)
        .mockResolvedValueOnce(mockClientUser); // Email em uso

      await expect(
        service.restore(mockManagerUser.id, mockAdminUser.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro se ADMIN tentar restaurar usuário de outra empresa', async () => {
      const deletedUser = {
        ...mockManagerUser,
        companyId: 'other-company',
        deletedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrismaService.user.findFirst.mockResolvedValue(deletedUser);

      await expect(
        service.restore(mockManagerUser.id, mockAdminUser.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
