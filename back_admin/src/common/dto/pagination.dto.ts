import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO base para paginação de resultados
 */
export class PaginationDto {
  /**
   * Número da página (inicia em 1)
   * @default 1
   */
  @ApiPropertyOptional({
    description: 'Número da página',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * Quantidade de itens por página
   * @default 10
   */
  @ApiPropertyOptional({
    description: 'Quantidade de itens por página',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  /**
   * Calcula o offset para queries no banco
   */
  get skip(): number {
    return (this.page! - 1) * this.limit!;
  }

  /**
   * Alias para limit (compatibilidade)
   */
  get take(): number {
    return this.limit!;
  }
}
