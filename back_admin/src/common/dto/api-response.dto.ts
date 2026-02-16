import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO base para respostas de sucesso da API
 */
export class ApiResponseDto<T = any> {
  @ApiProperty({ description: 'Status da resposta' })
  success: boolean;

  @ApiProperty({ description: 'Mensagem descritiva' })
  message: string;

  @ApiPropertyOptional({ description: 'Dados da resposta' })
  data?: T;

  @ApiPropertyOptional({ description: 'Timestamp da resposta' })
  timestamp?: string;

  constructor(message: string, data?: T, success: boolean = true) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * DTO para respostas de erro da API
 */
export class ApiErrorResponseDto {
  @ApiProperty({ description: 'Status da resposta', default: false })
  success: boolean;

  @ApiProperty({ description: 'Mensagem de erro' })
  message: string;

  @ApiProperty({ description: 'Código do erro' })
  error: string;

  @ApiPropertyOptional({ description: 'Status HTTP' })
  statusCode?: number;

  @ApiPropertyOptional({ description: 'Detalhes adicionais do erro' })
  details?: any;

  @ApiProperty({ description: 'Timestamp do erro' })
  timestamp: string;

  @ApiProperty({ description: 'Path da requisição' })
  path: string;

  constructor(
    message: string,
    error: string,
    path: string,
    statusCode?: number,
    details?: any,
  ) {
    this.success = false;
    this.message = message;
    this.error = error;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.path = path;
  }
}
