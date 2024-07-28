import { Controller, Get } from '@nestjs/common';
import { AIService } from './services/AIService';


@Controller()
export class AppController {
  constructor(private readonly aiService: AIService) { }

  @Get("/health")
  getHello(): object {
    return {
      "status": "working fine ;)"
    }
  }

  @Get("/test")
  async test(): Promise<object> {
    const prompt = "i want you to generate an example value for my path param : {dataset} used in this openapi path : /{dataset}/{version}/fields return only the generated value"
    const responses = []
    for (let index = 0; index < 17; index++) {
      responses.push(await this.aiService.ask(prompt))
    }
    
    return {
      responses
    }
  }
}
