import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { GptService } from './gpt.service';
import { SummarizeLoadsDto } from 'src/dto/summarize-loads.dto';

@Controller('summarize-loads')
export class GptController {
    constructor(private readonly gptService: GptService) {}

    @Post()
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async summarizeLoads(@Body() dto: SummarizeLoadsDto) {
        const { insights } = await this.gptService.summarizeLoads(dto.loads);
        
        return insights
    }
}
