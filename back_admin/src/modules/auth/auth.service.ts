import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { randomBytes } from 'crypto';

/**
 * Service de autenticação
 * Gerencia login, logout e refresh de tokens
 */
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Realiza login do usuário
   * Valida credenciais e retorna tokens de acesso
   */
  async login(loginDto: LoginDto): Promise<TokenResponseDto> {
    // Buscar usuário por email
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginDto.email,
        deletedAt: null, // Apenas usuários ativos
      },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        companyId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Validar senha
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Gerar tokens
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    // Calcular tempo de expiração do access token em segundos
    const expiresIn = this.parseExpirationTime(
      this.configService.get<string>('JWT_EXPIRES_IN', '1d'),
    );

    return new TokenResponseDto(accessToken, refreshToken, expiresIn, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      companyId: user.companyId,
    });
  }

  /**
   * Renova o access token usando refresh token
   */
  async refreshToken(refreshTokenString: string): Promise<TokenResponseDto> {
    // Buscar refresh token no banco
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: {
        token: refreshTokenString,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            companyId: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // Verificar se o token expirou
    if (refreshToken.expiresAt < new Date()) {
      // Remover token expirado
      await this.prisma.refreshToken.delete({
        where: { id: refreshToken.id },
      });
      throw new UnauthorizedException('Refresh token expirado');
    }

    // Verificar se usuário ainda está ativo
    if (refreshToken.user.deletedAt) {
      throw new UnauthorizedException('Usuário inativo');
    }

    // Gerar novo access token
    const accessToken = await this.generateAccessToken(refreshToken.user);

    // Calcular tempo de expiração
    const expiresIn = this.parseExpirationTime(
      this.configService.get<string>('JWT_EXPIRES_IN', '1d'),
    );

    return new TokenResponseDto(
      accessToken,
      refreshTokenString, // Mantém o mesmo refresh token
      expiresIn,
      {
        id: refreshToken.user.id,
        email: refreshToken.user.email,
        name: refreshToken.user.name,
        role: refreshToken.user.role as any,
        companyId: refreshToken.user.companyId,
      },
    );
  }

  /**
   * Realiza logout removendo o refresh token
   */
  async logout(refreshTokenString: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        token: refreshTokenString,
      },
    });
  }

  /**
   * Gera um access token JWT
   */
  private async generateAccessToken(user: {
    id: string;
    email: string;
    role: any;
    companyId: string | null;
  }): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    return this.jwtService.signAsync(payload as any);
  }

  /**
   * Gera e armazena um refresh token
   */
  private async generateRefreshToken(userId: string): Promise<string> {
    // Gerar token único
    const token = randomBytes(64).toString('hex');

    // Calcular data de expiração
    const expiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    const expiresAt = this.calculateExpirationDate(expiresIn);

    // Salvar no banco de dados
    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Calcula a data de expiração baseada em uma string (ex: '7d', '24h')
   */
  private calculateExpirationDate(expiresIn: string): Date {
    const time = parseInt(expiresIn);
    const unit = expiresIn.slice(-1);

    const now = new Date();

    switch (unit) {
      case 'd':
        return new Date(now.getTime() + time * 24 * 60 * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + time * 60 * 60 * 1000);
      case 'm':
        return new Date(now.getTime() + time * 60 * 1000);
      default:
        throw new BadRequestException('Formato de expiração inválido');
    }
  }

  /**
   * Converte string de tempo (ex: '1d', '24h') para segundos
   */
  private parseExpirationTime(expiresIn: string): number {
    const time = parseInt(expiresIn);
    const unit = expiresIn.slice(-1);

    switch (unit) {
      case 'd':
        return time * 24 * 60 * 60;
      case 'h':
        return time * 60 * 60;
      case 'm':
        return time * 60;
      default:
        return 86400; // 1 dia como padrão
    }
  }
}
