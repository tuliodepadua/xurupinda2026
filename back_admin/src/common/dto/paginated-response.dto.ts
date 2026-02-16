import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Metadados de paginação
 */
export class PaginationMeta {
  @ApiProperty({ description: 'Página atual' })
  currentPage: number;

  @ApiProperty({ description: 'Total de itens' })
  totalItems: number;

  @ApiProperty({ description: 'Itens por página' })
  itemsPerPage: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPages: number;

  @ApiProperty({ description: 'Tem próxima página' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Tem página anterior' })
  hasPreviousPage: boolean;
}

/**
 * DTO base para resposta paginada
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Lista de itens', isArray: true })
  data: T[];

  @ApiProperty({ description: 'Metadados da paginação', type: PaginationMeta })
  meta: PaginationMeta;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.meta = {
      currentPage: page,
      totalItems: total,
      itemsPerPage: limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1,
    };
  }
}
