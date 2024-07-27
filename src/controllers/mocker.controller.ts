import { All, Controller, Req } from "@nestjs/common";
import { Request } from "express";



@Controller("/mocks")
export class MockerController {
    @All()
    handleMocks(@Req() request: Request){
        return {
            method: request.method,
            path: request.path,
            
        }
    }
}