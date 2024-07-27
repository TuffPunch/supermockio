import { Module } from '@nestjs/common';
import { AppService } from './services/app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from './config/config.service';
import { ConfigModule } from './config/config.module';
import { Service, ServiceSchema } from './schemas/service.schema';
import { AppController } from './app.controller';
import { ServiceService } from './services/service.service';
import { ResponseService } from './services/response.service';
import { Response, ResponseSchema } from './schemas/response.schema';
import { ServiceController } from './controllers/service.controller';
import { MockerController } from './controllers/mocker.controller';

@Module({
  imports: [ ConfigModule,
    // MongoDB Connection Config
    MongooseModule.forRootAsync({
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => configService.getMongoConfig(),
    }), 
    // Service Schema DB config
    MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }]),
    // Response Schema DB config
    MongooseModule.forFeature([{ name: Response.name, schema: ResponseSchema }])
    ],
  controllers: [AppController, ServiceController, MockerController],
  providers: [AppService, ServiceService, ResponseService],
})
export class AppModule {}
