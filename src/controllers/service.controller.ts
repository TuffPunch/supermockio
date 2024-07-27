import { Controller, Get, HttpException, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ServiceService } from 'src/services/service.service';
import { createServiceDto } from 'src/dtos/createServiceDto';
import { ResponseService } from 'src/services/response.service';

import { FileInterceptor } from '@nestjs/platform-express';
import { parse } from 'yaml';
import { MockerResponse } from 'src/models/MockerResponse';


@Controller("/services")
export class ServiceController {
  constructor(private readonly serviceService: ServiceService, private readonly responseService: ResponseService) { }

  @Get()
  async getServices(): Promise<any> {
    return await this.serviceService.findAll()
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async createService(@UploadedFile() file: Express.Multer.File): Promise<any> {
    const newService = new createServiceDto()
    newService.openapi = parse(file.buffer.toString())
    // check if service already exist
    const exist = await this.serviceService.findOneByNameAndVersion(newService.openapi.info.title, newService.openapi.info.version)
    if (exist) throw new HttpException("Service already exists", HttpStatus.CONFLICT)
    // persist service if it doesn't exist
    newService.name = newService.openapi.info.title
    newService.version = newService.openapi.info.version
    const createdService = await this.serviceService.create(newService)
    if (!createdService) throw new HttpException("Error while adding the service", HttpStatus.INTERNAL_SERVER_ERROR)

    // save responses in DB with the new schema
    // newService.openapi.paths = Object.entries(newService.openapi.paths).forEach(([path, methods]) => {
    //   Object.entries(methods).forEach(([method, operation]) => {
    //     Object.keys(operation.responses).forEach(code => {
    //         const schema = operation.responses[code].content['application/json'].schema;
    //         //add endpoint to db
    //     })
    //   });
    // });


    
    return new MockerResponse(201, "Service added successfully")    

  }


  // @Get("/:name/responses")
  // getServiceResponses(@Param("name") serviceId: string){
  //   this.serviceService.findOneByName(serviceId)
  //   .then(async service => {
  //     console.log(service._id);
      
  //     const dto = new createResponseDto()
  //     dto.service = service._id
  //     dto.statusCode = 200
  //     dto.content = {
  //       "message": "works fine"
  //     }
  //     console.log(await this.responseService.create(dto));
      
  //     return {
  //       message: "created"
  //    }
  //   })
  //   .catch((error : Error) => {
  //     return {
  //       message: error.message
  //    }
      
  //   })

    
}
