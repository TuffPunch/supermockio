import { All, Controller, Param, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { ResponseService } from "src/services/response.service";
import { ServiceService } from "src/services/service.service";



@Controller("/mocks/:name/:version/*")
export class MockerController {
    constructor(private readonly responseService: ResponseService, private readonly serviceService: ServiceService) { }
    @All()
    async handleMocks(@Req() request: Request, @Param() params: string[], @Res() res: Response){
        
        const response =  {
            method: request.method.toLowerCase(),
            path: "/"+request.path.split("/").slice(4).join("/"),
            name: params['name'],
            version: params['version']
        }

        const service = await this.serviceService.findOneByNameAndVersion(response.name, response.version)
        const fetchedRes = await this.responseService.findOneByService(service._id, response.path, response.method)

        res.status(fetchedRes.statusCode).json(fetchedRes.content)
        
    }
}