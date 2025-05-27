import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class GptService {
    private readonly logger = new Logger(GptService.name);
    private openai: OpenAI;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) {
            this.logger.error('Missing OPENAI_API_KEY');
            throw new Error('OPENAI_API_KEY is not set');
        }
        this.openai = new OpenAI({ apiKey });
    }

    async summarizeLoads(loads: any[]): Promise<{ summary: string; insights: { [key: number]: string[] } }> {
        const prompt = this.buildPrompt(loads);

        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: 'You are a helpful logistics assistant.' },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.7,
                max_tokens: 4000,
            });

            const text = completion.choices[0].message?.content?.trim() ?? '';
            const insights = this.extractInsightsFromJson(text);

            const summary = this.extractSummary(text);
            return { summary, insights };
        } catch (error: any) {
            this.logger.error('OpenAI API error', error.response?.data || error.message);
            throw new InternalServerErrorException('GPT service failed to generate summary');
        }
    }

    private buildPrompt(loads: any[]): string {
        let prompt = `Please analyze the following loads data and provide a JSON response as described below:\n\n` +
                    `Return a valid JSON object where each load's ID is a key, and the value is an object containing:\n` +
                    `- summary: A concise summary of the load's transportation details (string).\n` +
                    `- insights: An array of strings containing insights for the load.\n\n` +
                    `The response should be strictly JSON format without any extra markdown or explanations.\n` +
                    `Example format: \n` +
                    `{\n` +
                    `  "88": {\n` +
                    `    "summary": "Load 88 involves a heavy load and requires two stops, impacting costs.",\n` +
                    `    "insights": ["The load is heavy", "Two stops are involved"]\n` +
                    `  },\n` +
                    `  "87": {\n` +
                    `    "summary": "Load 87 has a short transit time and unknown weight.",\n` +
                    `    "insights": ["Weight not specified", "Short transit time"]\n` +
                    `  }\n` +
                    `}\n\n` +
                    `Here is the data to analyze:\n`;

        loads.forEach((load, i) => {
            prompt += `Load ${i + 1} (ID: ${load.load_id}):\n`;
            prompt += `Origin: ${load.origin ?? 'N/A'}\n`;
            prompt += `Destination: ${load.destination ?? 'N/A'}\n`;
            prompt += `Loaded Weight: ${load.loadedWeight ?? 'N/A'}\n`;
            prompt += `Route: ${load.route ?? 'N/A'}\n`;
            prompt += `Pickup Time: ${load.pickupTime ?? 'N/A'}\n`;
            prompt += `Delivery Time: ${load.deliveryTime ?? 'N/A'}\n\n`;
        });

        prompt += 'Please return the response as a JSON object as described above without any extra text or markdown.';

        return prompt;
    }


    private extractSummary(text: string): string {
        const lines = text.split('\n');
        let summary = '';
        let inSummary = false;

        lines.forEach(line => {
            if (line.startsWith('### Load Analysis Summary')) {
                inSummary = true;
            } else if (line.startsWith('### Insights')) {
                inSummary = false;
            }

            if (inSummary) {
                summary += line.trim() + ' ';
            }
        });

        return summary.trim();
    }

    private extractInsightsFromJson(text: string): { [key: number]: string[] } {
        try {
            const jsonResponse = JSON.parse(text);
            if (!jsonResponse || typeof jsonResponse !== 'object') {
                throw new Error('Invalid JSON structure');
            }
            return jsonResponse;
        } catch (error) {
            this.logger.error('Failed to parse JSON response from GPT', error.message);
            return {};
        }
    }

}
