import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import axios from 'axios';
import { AppModule } from 'src/app.module';
import { JbhuntService } from '../src/load-extraction/jbhunt/jbhunt.service';
import { LandstarService } from '../src/load-extraction/landstar/landstar.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LoadExtractionController (POST /run)', () => {
    let app: INestApplication;

    const mockJbhuntService = {
        scrapeJbhuntLoads: jest.fn().mockResolvedValue([
            {
            origin: 'Columbus, OH',
            pickupTime: '2025-05-22 08:00',
            destination: 'Cleveland, OH',
            deliveryTime: '2025-05-23 12:00',
            route: 'Route A',
            loadedWeight: '15000 lbs',
            equipment: 'Flatbed',
            },
        ]),
    };

    const mockLandstarService = {
        scrapeLandstarLoads: jest.fn().mockResolvedValue([]),
    };

    beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    })
        .overrideProvider(JbhuntService).useValue(mockJbhuntService)
        .overrideProvider(LandstarService).useValue(mockLandstarService)
        .compile();

    app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('should return GPT summary and insights', async () => {
    mockedAxios.post.mockResolvedValue({
        data: {
        summary: 'Resumo de teste',
        insights: ['Insight 1', 'Insight 2'],
        },
    });

    const response = await request(app.getHttpServer())
        .post('/load-extraction/run')
        .expect(201);

        expect(response.body.status).toBe('success');
        expect(response.body.summary).toBeDefined();
        expect(response.body.insights).toHaveLength(2);
    });

    afterAll(async () => {
        await app.close();
    });
});
