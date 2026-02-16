import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { AuthenticatedUser } from '../../../common/interfaces/request-with-user.interface';

/**
 * Strategy JWT para validação de tokens
 * Extrai e valida o token JWT de cada requisição
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }

  /**
   * Valida o payload do JWT e retorna o usuário autenticado
   * Este método é chamado automaticamente após a validação do token
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Buscar usuário no banco para garantir que ainda existe e está ativo
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
        deletedAt: null, // Apenas usuários ativos
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo');
    }

    // Retornar dados do usuário que serão injetados no request
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      companyId: user.companyId,
    };
  }
}
