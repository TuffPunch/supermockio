import { Controller, Get } from '@nestjs/common';


@Controller()
export class AppController {
  constructor() { }

  @Get("/health")
  getHello(): object {
    return {
      "status": "working fine ;)"
    }
  }
}
