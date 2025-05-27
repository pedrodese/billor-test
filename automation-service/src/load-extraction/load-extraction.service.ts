import { Injectable, Logger } from '@nestjs/common';
import { JbhuntService, LoadInfo } from './jbhunt/jbhunt.service';
// import { LandstarLoad, LandstarService } from './landstar/landstar.service';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { ConfigService } from '@nestjs/config';
import { Counter, Histogram, Gauge } from 'prom-client';
import { Load } from 'src/entities/Load.entity';
import { Summary } from 'src/entities/Summary.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

axiosRetry(axios, {
  retries: 3,
  retryDelay: retryCount => Math.pow(2, retryCount) * 1000,
  retryCondition: error => !error.response || error.response.status >= 500,
});

const extractionRuns = new Counter({
  name: 'load_extraction_runs_total',
  help: 'Total number of load extraction runs',
});

const extractionFailures = new Counter({
  name: 'load_extraction_failures_total',
  help: 'Total number of failed load extractions',
  labelNames: ['source'],
});

const extractionDuration = new Histogram({
  name: 'load_extraction_duration_seconds',
  help: 'Duration of load extraction runs in seconds',
  buckets: [0.5, 1, 2, 5, 10, 30, 60],
});

const extractedItems = new Gauge({
  name: 'load_extracted_items_total',
  help: 'Number of loads extracted in the last run',
});

@Injectable()
export class LoadExtractionService {
  private readonly logger = new Logger(LoadExtractionService.name);

  constructor(
    @InjectRepository(Load)
    private loadRepository: Repository<Load>,
    @InjectRepository(Summary)
    private summaryRepository: Repository<Summary>,
    private readonly jbhuntService: JbhuntService,
    // private readonly landstarService: LandstarService,
    private readonly configService: ConfigService,
  ) {}

  async runAutomation(): Promise<any> {
    extractionRuns.inc();
    const endTimer = extractionDuration.startTimer();

    const { jbhuntLoads /*, landstarLoads */ } = await this.extractAllLoads();
    const allLoads = [...jbhuntLoads /*, ...landstarLoads */];
    extractedItems.set(allLoads.length);

    endTimer();

    if (allLoads.length === 0) {
      this.logger.warn('No loads found from any source.');
      return {
        statusCode: 204,
        message: 'No loads extracted from any source.',
      };
    }

    const failedSources: string[] = [];
    if (jbhuntLoads.length === 0) failedSources.push('JB Hunt');
    // if (landstarLoads.length === 0) failedSources.push('Landstar');

    const savedLoads = await this.saveLoads(allLoads);

    const gptServiceUrl =
      this.configService.get<string>('GPT_SERVICE_URL') || 'http://gpt-service:3000';
    const response = await this.sendToGptService(savedLoads, gptServiceUrl);

    await this.saveGptSummary(savedLoads, response.data);

    return {
      status: 'success',
      message:
        failedSources.length > 0
          ? `Extraction completed with failures in: ${failedSources.join(', ')}`
          : 'Extraction successful',
      summary: response.data.summary,
      insights: response.data.insights,
    };
  }

  private async saveLoads(loads: any[]): Promise<Load[]> {
    this.logger.log('Saving loads in the database...');
    const savedLoads = await Promise.all(
      loads.map(async load => {
        const loadEntity = this.loadRepository.create({
          origin: load.origin,
          destination: load.destination,
          pickupTime: load.pickupTime,
          deliveryTime: load.deliveryTime,
          route: load.route,
          loadedWeight: load.loadedWeight,
          equipment: load.equipment,
        });
        return await this.loadRepository.save(loadEntity);
      }),
    );
    return savedLoads;
  }

  private async sendToGptService(savedLoads: Load[], gptServiceUrl: string) {
    this.logger.log('Sending loads to GPT service...');
    this.logger.log(JSON.stringify(savedLoads));
    try {
      const response = await axios.post(`${gptServiceUrl}/summarize-loads`, {
        loads: savedLoads.map(load => ({
          load_id: load.id,
          origin: load.origin,
          destination: load.destination,
          loadedWeight: load.loadedWeight,
          route: load.route,
          pickupTime: load.pickupTime,
          deliveryTime: load.deliveryTime,
          equipment: load.equipment,
        })),
      });
      return response;
    } catch (error) {
      this.logger.error('Failed to communicate with GPT service after retries', error.stack);
      throw new Error('GPT service failed');
    }
  }

  private async saveGptSummary(savedLoads: Load[], gptResponse: any): Promise<void> {
    this.logger.log('Saving GPT summary and insights...');

    await Promise.all(
      savedLoads.map(async load => {
        const loadInsights = gptResponse[String(load.id)];
        const loadSummary = loadInsights ? loadInsights.summary : '';

        if (!loadInsights || loadSummary === '') {
          this.logger.warn(`Missing insights or summary for Load ID: ${load.id}`);
        }

        const summaryEntity = this.summaryRepository.create({
          load: load,
          summary_text: loadSummary,
          insights: loadInsights ? loadInsights.insights : [],
          created_at: new Date(),
        });

        await this.summaryRepository.save(summaryEntity);
      }),
    );
  }

  public async extractAllLoads(): Promise<{ jbhuntLoads: LoadInfo[] /*, landstarLoads: LandstarLoad[] */ }> {
    this.logger.log('Starting load extraction for JB Hunt');
    
    const jbhuntLoads = await this.safeScrape(() => this.jbhuntService.scrapeJbhuntLoads(), 'jbhunt');

    // const landstarLoads = await this.safeScrape(() => this.landstarService.scrapeLandstarLoads(), 'landstar');

    return { jbhuntLoads /*, landstarLoads */ };
  }

  private async safeScrape<T>(fn: () => Promise<T>, label: string): Promise<T> {
    try {
      const result = await fn();
      this.logger.log(
        `Successfully extracted ${Array.isArray(result) ? result.length : 0} loads from ${label}`,
      );
      return result;
    } catch (error) {
      extractionFailures.inc({ source: label });
      this.logger.error(`Failed to extract loads from ${label}`, error.stack);
      return [] as unknown as T;
    }
  }
}
