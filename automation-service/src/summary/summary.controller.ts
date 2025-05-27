import { Controller, Get, Query } from '@nestjs/common';
import { SummaryService } from './summary.service';

@Controller('summaries')
export class SummaryController {
    constructor(private readonly summaryService: SummaryService) {}

    @Get()
    async getAll(@Query('page') page = 1, @Query('limit') limit = 10,) {
        const pageNumber = Math.max(1, Number(page));
        const pageSize = Math.max(1, Math.min(100, Number(limit)));

        return this.summaryService.getAll(pageNumber, pageSize);
    }
}
