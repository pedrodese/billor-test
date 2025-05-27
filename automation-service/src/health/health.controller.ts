import { Controller, Get, HttpCode } from '@nestjs/common';

@Controller('health')
export class HealthController {
    @Get()
    healthCheck(){
        return {status: 'ok', service: 'automation-service'}
    }
}
