import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { LoadExtractionService } from './load-extraction/load-extraction.service';
import { MetricsController } from './metrics/metrics.controller';
import { LoadExtractionController } from './load-extraction/load-extraction.controller';
import { JbhuntService } from './load-extraction/jbhunt/jbhunt.service';
import { LandstarService } from './load-extraction/landstar/landstar.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Load } from './entities/Load.entity';
import { Summary } from './entities/Summary.entity';
import { SummaryController } from './summary/summary.controller';
import { SummaryService } from './summary/summary.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'db',
      port: 5432,
      username: process.env.DATABASE_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'automation_db',
      entities: [Load, Summary],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([Load, Summary]),
  ],
  controllers: [HealthController, LoadExtractionController, MetricsController, SummaryController],
  providers: [LoadExtractionService, JbhuntService, LandstarService, SummaryService],
})
export class AppModule {}
