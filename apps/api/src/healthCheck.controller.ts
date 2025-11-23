import { Controller, Get } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { Health, healthSchema } from '@packages/schemas';
import { zodToOpenAPI } from 'nestjs-zod';

@Controller('health-check')
export class HealthCheckController {
  @Get()
  @ApiResponse({
    status: 200,
    description: 'Health check endpoint',
    schema: zodToOpenAPI(healthSchema),
  })
  getHealthCheck(): Promise<Health> {
    return Promise.resolve({ 
      health: 'Ok', 
      timestamp: new Date().toISOString() 
    });
  }
}

