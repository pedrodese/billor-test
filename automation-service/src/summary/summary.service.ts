import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Summary } from '../entities/Summary.entity';

@Injectable()
export class SummaryService {
    constructor(
        @InjectRepository(Summary)
        private readonly summaryRepository: Repository<Summary>,
    ) {}

    async getAll(page: number, limit: number) {
        const [data, total] = await this.summaryRepository.findAndCount({
            relations: ['load'],
            order: { created_at: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            data,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }

}
