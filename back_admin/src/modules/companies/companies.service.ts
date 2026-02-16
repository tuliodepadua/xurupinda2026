import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto, CompanyResponseDto } from './dto';
import { PaginationDto } from '../../common/dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cria uma nova empresa
   * Apenas Masters podem criar empresas
   */
  async create(
    createCompanyDto: CreateCompanyDto,
  ): Promise<CompanyResponseDto> {
    // Verifica se slug já existe
    const existingCompany = await this.prisma.company.findUnique({
      where: { slug: createCompanyDto.slug },
    });

    if (existingCompany) {
      throw new ConflictException(
        `Empresa com slug "${createCompanyDto.slug}" já existe`,
      );
    }

    // Verifica se email já está em uso (se fornecido)
    if (createCompanyDto.email) {
      const emailInUse = await this.prisma.company.findFirst({
        where: {
          email: createCompanyDto.email,
          deletedAt: null,
        },
      });

      if (emailInUse) {
        throw new ConflictException(
          `Email "${createCompanyDto.email}" já está em uso`,
        );
      }
    }

    const company = await this.prisma.company.create({
      data: createCompanyDto,
      include: {
        _count: {
          select: {
            users: true,
            companyModules: true,
          },
        },
      },
    });

    return company;
  }

  /**
   * Lista todas as empresas com paginação
   * Apenas Masters podem listar todas as empresas
   */
  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              companyModules: true,
            },
          },
        },
      }),
      this.prisma.company.count({
        where: { deletedAt: null },
      }),
    ]);

    return {
      data: companies,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca uma empresa por ID
   */
  async findOne(id: string): Promise<CompanyResponseDto> {
    const company = await this.prisma.company.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            users: true,
            companyModules: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException(`Empresa com ID "${id}" não encontrada`);
    }

    return company;
  }

  /**
   * Busca uma empresa por slug
   */
  async findBySlug(slug: string): Promise<CompanyResponseDto> {
    const company = await this.prisma.company.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            users: true,
            companyModules: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException(`Empresa com slug "${slug}" não encontrada`);
    }

    return company;
  }

  /**
   * Atualiza uma empresa
   * Apenas Masters podem atualizar empresas
   */
  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<CompanyResponseDto> {
    // Verifica se empresa existe
    await this.findOne(id);

    // Se está alterando o slug, verifica se não existe outro com o mesmo
    if (updateCompanyDto.slug) {
      const existingCompany = await this.prisma.company.findFirst({
        where: {
          slug: updateCompanyDto.slug,
          id: { not: id },
        },
      });

      if (existingCompany) {
        throw new ConflictException(
          `Empresa com slug "${updateCompanyDto.slug}" já existe`,
        );
      }
    }

    // Se está alterando o email, verifica se não está em uso
    if (updateCompanyDto.email) {
      const emailInUse = await this.prisma.company.findFirst({
        where: {
          email: updateCompanyDto.email,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (emailInUse) {
        throw new ConflictException(
          `Email "${updateCompanyDto.email}" já está em uso`,
        );
      }
    }

    const company = await this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
      include: {
        _count: {
          select: {
            users: true,
            companyModules: true,
          },
        },
      },
    });

    return company;
  }

  /**
   * Remove uma empresa (soft-delete)
   * Remove em cascata: usuários, módulos, permissões
   * Apenas Masters podem deletar empresas
   */
  async remove(id: string): Promise<void> {
    // Verifica se empresa existe
    await this.findOne(id);

    // Verifica se há usuários ativos
    const activeUsersCount = await this.prisma.user.count({
      where: {
        companyId: id,
        deletedAt: null,
      },
    });

    if (activeUsersCount > 0) {
      throw new BadRequestException(
        `Não é possível deletar empresa com ${activeUsersCount} usuário(s) ativo(s). Delete os usuários primeiro.`,
      );
    }

    // Soft-delete da empresa
    await this.prisma.$transaction(async (tx) => {
      // Marca empresa como deletada
      await tx.company.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Marca todos os módulos da empresa como deletados
      await tx.companyModule.updateMany({
        where: { companyId: id },
        data: { deletedAt: new Date() },
      });

      // Marca todas as permissões relacionadas como deletadas
      const companyModuleIds = await tx.companyModule.findMany({
        where: { companyId: id },
        select: { id: true },
      });

      const moduleIds = companyModuleIds.map((m) => m.id);

      if (moduleIds.length > 0) {
        await tx.userModulePermission.updateMany({
          where: { companyModuleId: { in: moduleIds } },
          data: { deletedAt: new Date() },
        });
      }
    });
  }

  /**
   * Restaura uma empresa deletada
   */
  async restore(id: string): Promise<CompanyResponseDto> {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException(`Empresa com ID "${id}" não encontrada`);
    }

    if (!company.deletedAt) {
      throw new BadRequestException('Empresa não está deletada');
    }

    const restoredCompany = await this.prisma.company.update({
      where: { id },
      data: { deletedAt: null },
      include: {
        _count: {
          select: {
            users: true,
            companyModules: true,
          },
        },
      },
    });

    return restoredCompany;
  }
}
