import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';

/**
 * DTO de resposta após login bem-sucedido
 */
export class TokenResponseDto {
  @ApiProperty({
    description: 'Token de acesso JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token de refresh para renovação',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Tipo do token',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Tempo de expiração do access token em segundos',
    example: 86400,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Dados do usuário autenticado',
  })
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    companyId: string | null;
  };

  constructor(
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      companyId: string | null;
    },
  ) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenType = 'Bearer';
    this.expiresIn = expiresIn;
    this.user = user;
  }
}
