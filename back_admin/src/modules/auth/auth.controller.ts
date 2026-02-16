import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, TokenResponseDto } from './dto';
import { Public } from '../../common/decorators/public.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

/**
 * Controller de autenticação
 * Gerencia rotas de login, logout e refresh de tokens
 */
@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint de login
   * Autentica usuário e retorna tokens de acesso
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login de usuário',
    description: 'Autentica usuário com email e senha, retornando tokens JWT',
  })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
  })
  async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * Endpoint de refresh token
   * Renova o access token usando refresh token válido
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar access token',
    description: 'Gera novo access token usando refresh token válido',
  })
  @ApiResponse({
    status: 200,
    description: 'Token renovado com sucesso',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido ou expirado',
  })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  /**
   * Endpoint de logout
   * Invalida o refresh token do usuário
   */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout de usuário',
    description: 'Invalida o refresh token, realizando logout',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso',
  })
  async logout(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<ApiResponseDto> {
    await this.authService.logout(refreshTokenDto.refreshToken);
    return new ApiResponseDto('Logout realizado com sucesso');
  }
}
