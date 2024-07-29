import { All, Controller, HttpException, HttpStatus, Param, Req, Res } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { Request, Response } from "express";
import { ResponseService } from "src/services/response.service";
import { ServiceService } from "src/services/service.service";


@ApiExcludeController()
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
        if (!fetchedRes) throw new HttpException("The request endpoint is not defined in this service",HttpStatus.NOT_FOUND)
        
        res.status(fetchedRes.statusCode).json(fetchedRes.content)
        
    }
}