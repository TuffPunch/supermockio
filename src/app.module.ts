import { Module } from '@nestjs/common';
import { AppController } from './controllers/app.controller';
import { AppService } from './services/app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from './config/config.service';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ ConfigModule,
    // MongoDB Connection
    MongooseModule.forRootAsync({
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => configService.getMongoConfig(),
    })
    ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
