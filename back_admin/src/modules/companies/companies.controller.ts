import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { Role } from '../../common/enums';
import { PaginationDto, ApiResponseDto } from '../../common/dto';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MASTER) // Apenas Masters podem gerenciar empresas
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  /**
   * Cria uma nova empresa
   * POST /companies
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCompanyDto: CreateCompanyDto) {
    const company = await this.companiesService.create(createCompanyDto);
    return new ApiResponseDto('Empresa criada com sucesso', company);
  }

  /**
   * Lista todas as empresas com paginação
   * GET /companies?page=1&limit=10
   */
  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    const result = await this.companiesService.findAll(pagination);
    return new ApiResponseDto('Empresas listadas com sucesso', result);
  }

  /**
   * Busca uma empresa por ID
   * GET /companies/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const company = await this.companiesService.findOne(id);
    return new ApiResponseDto('Empresa encontrada com sucesso', company);
  }

  /**
   * Busca uma empresa por slug
   * GET /companies/slug/:slug
   */
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const company = await this.companiesService.findBySlug(slug);
    return new ApiResponseDto('Empresa encontrada com sucesso', company);
  }

  /**
   * Atualiza uma empresa
   * PATCH /companies/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    const company = await this.companiesService.update(id, updateCompanyDto);
    return new ApiResponseDto('Empresa atualizada com sucesso', company);
  }

  /**
   * Remove uma empresa (soft-delete)
   * DELETE /companies/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.companiesService.remove(id);
  }

  /**
   * Restaura uma empresa deletada
   * PATCH /companies/:id/restore
   */
  @Patch(':id/restore')
  async restore(@Param('id') id: string) {
    const company = await this.companiesService.restore(id);
    return new ApiResponseDto('Empresa restaurada com sucesso', company);
  }
}
