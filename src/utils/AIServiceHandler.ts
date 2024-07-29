import { GeminiService } from "src/services/GeminiService";
import { AIServiceInterface } from "./AIServiceInterface";


export class AIServiceHandler {
    public static getAIService() : AIServiceInterface {
        const name = process.env['AI_SERVICE_NAME']
        switch(name) {
            case "gemini": return new GeminiService()
            default: throw new Error("please set AI_SERVICE_NAME environment variable to select an AI service to use")
        }
    }
}