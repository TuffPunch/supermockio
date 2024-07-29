import { Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ServiceService } from 'src/services/service.service';
import { createServiceDto } from 'src/dtos/createServiceDto';
import { ResponseService } from 'src/services/response.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { parse } from 'yaml';
import { MockerResponse } from 'src/utils/MockerResponse';


@Controller("/services")
export class ServiceController {
  constructor(private readonly serviceService: ServiceService, private readonly responseService: ResponseService) { }

  @Get()
  async getAllServices(): Promise<any> {
    return await this.serviceService.findAll()
  }

  @Get("/:name/:version")
  async getServiceResponses(@Param("name") name: string, @Param("version") version: string): Promise<any> {
    const service = await this.serviceService.findOneByNameAndVersion(name, version)
    return await this.responseService.findByService(service._id)
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
