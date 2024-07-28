import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai"
import { Injectable } from "@nestjs/common"
import { RateLimiter } from "limiter"


@Injectable()
export class AIService {
    private model: GenerativeModel
    private rateLimiter: RateLimiter

    private getModel() {
        if (!this.model)
            this.model = new GoogleGenerativeAI(process.env['GEMINI_API_KEY']).getGenerativeModel({ model: "gemini-1.5-flash"})
        return this.model 
    }

    private getRateLimiter() {
        if (!this.rateLimiter)
            this.rateLimiter = new RateLimiter({ tokensPerInterval: 15, interval: "min" })
        return this.rateLimiter
    }

    private cleanJson(response) {
        // Remove markdown annotations
        const cleanedResponse = response.replace(/```json|```/g, '');
      
        // Parse the cleaned JSON string
        
        const jsonData = JSON.parse(cleanedResponse);
      
        return jsonData;
      }


    public async ask(prompt: string) {
        await this.getRateLimiter().removeTokens(1)
        const result = await this.getModel().generateContent(prompt)
        const response = result.response;
        const text = this.cleanJson(response.text().trim());
        return text
    }
}