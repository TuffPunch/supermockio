import { Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ServiceService } from 'src/services/service.service';
import { createServiceDto } from 'src/dtos/createServiceDto';
import { ResponseService } from 'src/services/response.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { parse } from 'yaml';
import { MockerResponse } from 'src/utils/MockerResponse';
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileUploadDto } from 'src/dtos/FileUploadDto';
import { Service } from 'src/schemas/service.schema';
import { Response } from 'src/schemas/response.schema';

@ApiTags('services')
@Controller("/api/services")
export class ServiceController {
  constructor(private readonly serviceService: ServiceService, private readonly responseService: ResponseService) { }

  @Get()
  @ApiResponse({ status: 200, description: 'List of services.', type: Service, example: [
    new Service("635sqsdd1587", "Test Service", "1.0.0","Description here", {
      info: {title: "Test Service", version: "1.0.0"},
      paths: {
        "/tests": {}
      }
    })
  ]})
  async getAllServices(): Promise<Service[]> {
    return await this.serviceService.findAll()
  }


  @ApiResponse({ status: 200, description: "List of a service's responses", type: Response, example: [
    {
      "_id": "66a820787d7d5be3d146d78f",
      "statusCode": 200,
      "content": [
        {
          "id": 1,
          "name": "dog",
          "tag": "puppy"
        },
        {
          "id": 2,
          "name": "cat",
          "tag": "kitten"
        }
      ],
      "service": "66a820777d7d5be3d146d78d",
      "path": "/pets",
      "method": "get",
      "__v": 0
    }]
  })
  @Get("/:name/:version")
  async getServiceResponses(@Param("name") name: string, @Param("version") version: string): Promise<Response[]> {
    const service = await this.serviceService.findOneByNameAndVersion(name, version)
    if (!service) throw new HttpException("The service cannot be found",HttpStatus.NOT_FOUND)
    return await this.responseService.findByService(service._id)
  }


  @ApiResponse({status: 200, description: "Delete a service and it's responses", type: MockerResponse, example: new MockerResponse(200, "Responses Deleted successfully")})
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'openapi file',
    type: FileUploadDto,
  })
  @ApiResponse({ status: 201, description: 'The service has been successfully created.', type: MockerResponse, example: new MockerResponse(201, {
    message: "Service added successfully",
    service: {
      name: "Test Service",
      version: "1.0.0"
    }
  })})
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
    newService.description = newService.openapi.info.description ?? "-"
    const createdService = await this.serviceService.create(newService)
    if (!createdService) throw new HttpException("Error while adding the service", HttpStatus.INTERNAL_SERVER_ERROR)
    // save responses in DB with the new schema
    await this.serviceService.createServiceResponses(createdService)
    
    return new MockerResponse(201, {
      message: "Service added successfully",
      service: {
        name: createdService.name,
        version: createdService.version
      }
    })    

  }


    
}
