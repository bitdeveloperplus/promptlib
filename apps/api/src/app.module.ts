import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthCheckController } from './healthCheck.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Add modules here as you build them
  ],
  controllers: [AppController, HealthCheckController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}

