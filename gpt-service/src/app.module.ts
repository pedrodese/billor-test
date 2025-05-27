import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { GptController } from './gpt/gpt.controller';
import { GptService } from './gpt/gpt.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [HealthController, GptController],
  providers: [GptService],
})
export class AppModule {}
