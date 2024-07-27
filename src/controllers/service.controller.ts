import { Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ServiceService } from 'src/services/service.service';
import { createServiceDto } from 'src/dtos/createServiceDto';
import { ResponseService } from 'src/services/response.service';

import { FileInterceptor } from '@nestjs/platform-express';
import { parse } from 'yaml';
import { MockerResponse } from 'src/models/MockerResponse';
import { CreateResponseDto } from 'src/dtos/createResponseDto';
import { MockerUtils, Parameter } from 'src/models/MockerUtils';


@Controller("/services")
export class ServiceController {
  constructor(private readonly serviceService: ServiceService, private readonly responseService: ResponseService) { }

  @Get()
  async getServices(): Promise<any> {
    return await this.serviceService.findAll()
  }

  @Delete("/:name/:version")
  async deleteServicesResponses(@Param("name") name: string, @Param("version") version: string): Promise<any> {
    const service = await this.serviceService.findOneByNameAndVersion(name, version)
    if (!service) throw new HttpException("Service doesn't exists", HttpStatus.NOT_FOUND)
    await this.responseService.deleteByService(service._id)
    await this.serviceService.delete(service._id)
    return new MockerResponse(200, "Responses Deleted successfully")
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async createService(@UploadedFile() file: Express.Multer.File, @Query("override") override: number = 0): Promise<any> {
    const newService = new createServiceDto()
    newService.openapi = parse(file.buffer.toString())
    const exist = await this.serviceService.findOneByNameAndVersion(newService.openapi.info.title, newService.openapi.info.version)
    // override query param used to override an existing service
    if (override == 0 && exist) {
      if (exist) throw new HttpException("Service already exists", HttpStatus.CONFLICT)
    } else if (exist) {
    // delete the service and its responses if override != 0 and service exists
      await this.responseService.deleteByService(exist._id)
      await this.serviceService.delete(exist._id)
    } 
    // persist service if it doesn't exist
    newService.name = newService.openapi.info.title
    newService.version = newService.openapi.info.version
    const createdService = await this.serviceService.create(newService)
    if (!createdService) throw new HttpException("Error while adding the service", HttpStatus.INTERNAL_SERVER_ERROR)

    // save responses in DB with the new schema
    Object.entries(newService.openapi.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, operation]) => {
       
        const generatedPath = MockerUtils.generatePath(path, Parameter.arrayFrom(operation.parameters, newService.openapi), newService.openapi);
        Object.keys(operation.responses).forEach(code => {
            const schema = operation.responses[code].content['application/json'].schema;
            // add endpoint to db
            const content = MockerUtils.generateExample(schema, newService.openapi)           
            const response = {method, path: generatedPath, service: createdService._id, statusCode: Number.parseInt(code), content} as CreateResponseDto
            this.responseService.create(response)
        })
      });
    });


    
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
