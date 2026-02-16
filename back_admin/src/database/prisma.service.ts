import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private configService: ConfigService) {
    const pool = new Pool({
      connectionString: configService.get<string>('DATABASE_URL'),
    });
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Helper para queries com soft-delete automático
   * Retorna query base que filtra registros deletados
   */
  get activeRecords() {
    return {
      where: {
        deletedAt: null,
      },
    };
  }

  /**
   * Soft delete - marca registro como deletado
   */
  async softDelete<T extends { deletedAt?: Date }>(
    model: any,
    where: any,
  ): Promise<T> {
    return model.update({
      where,
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Soft delete many - marca múltiplos registros como deletados
   */
  async softDeleteMany(model: any, where: any): Promise<{ count: number }> {
    return model.updateMany({
      where,
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Restaurar registro deletado
   */
  async restore<T>(model: any, where: any): Promise<T> {
    return model.update({
      where,
      data: {
        deletedAt: null,
      },
    });
  }
}
