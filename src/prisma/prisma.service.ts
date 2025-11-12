import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// Import Prisma client from the generated output so TS/Node resove the generated client
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect(); // se conecta a la BD al iniciar el módulo
    console.log('✅ Prisma conectado a PostgreSQL');
  }

  async onModuleDestroy() {
    await this.$disconnect(); // cierra la conexión al finalizar
  }
}
