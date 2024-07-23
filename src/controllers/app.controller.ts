import { Controller, Get } from '@nestjs/common';
import { AppService } from '../services/app.service';
import { ConfigService } from 'src/config/config.service';


@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly configService: ConfigService) { }

  @Get()
  getHello(): string {
    return this.configService.get("MONGO_USER");
  }
}
