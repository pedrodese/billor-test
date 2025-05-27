import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GptService } from './gpt.service';

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

describe('GptService', () => {
  let service: GptService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('fake-api-key'),
  };

  const mockCompletionResponse = {
    choices: [
      {
        message: {
          content: JSON.stringify({
            1: {
              summary: 'Test summary for load 1',
              insights: ['Insight 1', 'Insight 2'],
            },
          }),
        },
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GptService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GptService>(GptService);
    configService = module.get<ConfigService>(ConfigService);

    (service as any).openai.chat.completions.create = jest
      .fn()
      .mockResolvedValue(mockCompletionResponse);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return summary and insights correctly', async () => {
    const result = await service.summarizeLoads([
      {
        load_id: 1,
        origin: 'Origin A',
        destination: 'Destination B',
        loadedWeight: '2000 lbs',
        route: 'Route 12',
        pickupTime: 'Tomorrow 8am',
        deliveryTime: 'Tomorrow 4pm',
      },
    ]);

    expect(result).toHaveProperty('insights');
    expect(result.insights[1]).toBeDefined();
    expect(result.insights[1].length).toBe(2);
  });

  it('should handle OpenAI API error', async () => {
    (service as any).openai.chat.completions.create = jest
      .fn()
      .mockRejectedValue(new Error('API failure'));

    await expect(
      service.summarizeLoads([
        {
          load_id: 1,
          origin: 'A',
          destination: 'B',
          pickupTime: '',
          deliveryTime: '',
          route: '',
          loadedWeight: '',
          equipment: '',
        },
      ])
    ).rejects.toThrow('GPT service failed to generate summary');
  });
});
