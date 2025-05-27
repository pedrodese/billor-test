import { Controller, Get, Post, Res } from '@nestjs/common';
import { LoadExtractionService } from './load-extraction.service';
import { Response } from 'express';

@Controller('load-extraction')
export class LoadExtractionController {
    constructor(private readonly loadExtractionService: LoadExtractionService) {}

    @Get('all-loads')
    async getAllLoads() {
        return this.loadExtractionService.extractAllLoads();
    }

    @Post('run')
    async runAutomation(@Res() res: Response) {
        const result = await this.loadExtractionService.runAutomation();
        if (result?.statusCode === 204) {
            return res.status(204).send();
        }
        if (result?.status === 'error') {
            return res.status(500).json(result);
        }
        return res.status(201).json(result);
    }

}
