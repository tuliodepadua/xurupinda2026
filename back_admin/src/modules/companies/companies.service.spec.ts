import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { PrismaService } from '../../database/prisma.service';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    company: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    companyModule: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    userModulePermission: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    prisma = module.get<PrismaService>(PrismaService);

    // Limpar mocks antes de cada teste
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      name: 'Test Company',
      slug: 'test-company',
      email: 'test@company.com',
      phone: '1234567890',
    };

    it('deve criar uma empresa com sucesso', async () => {
      const mockCompany = {
        id: '1',
        ...createDto,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { users: 0, companyModules: 0 },
      };

      mockPrismaService.company.findUnique.mockResolvedValue(null);
      mockPrismaService.company.findFirst.mockResolvedValue(null);
      mockPrismaService.company.create.mockResolvedValue(mockCompany);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCompany);
      expect(mockPrismaService.company.create).toHaveBeenCalledWith({
        data: createDto,
        include: {
          _count: {
            select: { users: true, companyModules: true },
          },
        },
      });
    });

    it('deve lançar ConflictException se slug já existe', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({
        id: '1',
        slug: createDto.slug,
      });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow('já existe');
    });

    it('deve lançar ConflictException se email já está em uso', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue(null);
      mockPrismaService.company.findFirst.mockResolvedValue({
        id: '1',
        email: createDto.email,
      });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow('já está em uso');
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de empresas', async () => {
      const mockCompanies = [
        {
          id: '1',
          name: 'Company 1',
          slug: 'company-1',
          _count: { users: 5, companyModules: 3 },
        },
      ];

      mockPrismaService.company.findMany.mockResolvedValue(mockCompanies);
      mockPrismaService.company.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockCompanies);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('findOne', () => {
    it('deve retornar uma empresa por ID', async () => {
      const mockCompany = {
        id: '1',
        name: 'Test Company',
        slug: 'test-company',
        deletedAt: null,
        _count: { users: 0, companyModules: 0 },
      };

      mockPrismaService.company.findFirst.mockResolvedValue(mockCompany);

      const result = await service.findOne('1');

      expect(result).toEqual(mockCompany);
    });

    it('deve lançar NotFoundException se empresa não existe', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('deve retornar uma empresa por slug', async () => {
      const mockCompany = {
        id: '1',
        name: 'Test Company',
        slug: 'test-company',
        deletedAt: null,
      };

      mockPrismaService.company.findFirst.mockResolvedValue(mockCompany);

      const result = await service.findBySlug('test-company');

      expect(result).toEqual(mockCompany);
    });

    it('deve lançar NotFoundException se empresa não existe', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue(null);

      await expect(service.findBySlug('invalid-slug')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Company',
    };

    it('deve atualizar uma empresa com sucesso', async () => {
      const mockCompany = {
        id: '1',
        name: 'Test Company',
        slug: 'test-company',
        deletedAt: null,
      };

      const updatedCompany = { ...mockCompany, ...updateDto };

      mockPrismaService.company.findFirst.mockResolvedValue(mockCompany);
      mockPrismaService.company.update.mockResolvedValue(updatedCompany);

      const result = await service.update('1', updateDto);

      expect(result.name).toEqual(updateDto.name);
    });

    it('deve lançar ConflictException ao tentar usar slug já existente', async () => {
      mockPrismaService.company.findFirst
        .mockResolvedValueOnce({ id: '1', slug: 'old-slug' })
        .mockResolvedValueOnce({ id: '2', slug: 'new-slug' });

      await expect(service.update('1', { slug: 'new-slug' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('deve lançar BadRequestException se há usuários ativos', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue({ id: '1' });
      mockPrismaService.user.count.mockResolvedValue(5);

      await expect(service.remove('1')).rejects.toThrow(BadRequestException);
      await expect(service.remove('1')).rejects.toThrow('usuário(s) ativo(s)');
    });

    it('deve deletar empresa em cascata quando não há usuários', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue({ id: '1' });
      mockPrismaService.user.count.mockResolvedValue(0);
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.company.update.mockResolvedValue({ id: '1' });
      mockPrismaService.companyModule.findMany.mockResolvedValue([
        { id: 'mod1' },
      ]);

      await service.remove('1');

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('deve restaurar uma empresa deletada', async () => {
      const deletedCompany = {
        id: '1',
        name: 'Test',
        deletedAt: new Date(),
      };

      const restoredCompany = { ...deletedCompany, deletedAt: null };

      mockPrismaService.company.findUnique.mockResolvedValue(deletedCompany);
      mockPrismaService.company.update.mockResolvedValue(restoredCompany);

      const result = await service.restore('1');

      expect(result.deletedAt).toBeNull();
    });

    it('deve lançar BadRequestException se empresa não está deletada', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({
        id: '1',
        deletedAt: null,
      });

      await expect(service.restore('1')).rejects.toThrow(BadRequestException);
    });
  });
});
