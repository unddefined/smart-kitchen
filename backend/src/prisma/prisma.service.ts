import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    
    console.log('[PrismaService] Connection string configured:', !!connectionString);
    console.log('[PrismaService] Creating adapter...');
    
    const adapter = new PrismaPg({ connectionString });
    
    console.log('[PrismaService] Adapter created, initializing PrismaClient...');

    super({
      adapter,
      log: ['error'], // 只记录错误，减少日志
    });
    
    console.log('[PrismaService] PrismaClient initialized');
  }

  async onModuleInit() {
    console.log('[PrismaService] Connecting to database...');
    try {
      await this.$connect();
      console.log('[PrismaService] ✅ Connected successfully!');
    } catch (error) {
      console.error('[PrismaService] ❌ Connection failed:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
