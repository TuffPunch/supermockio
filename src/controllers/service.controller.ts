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
    /// move this in a function in service layer
    const paths = newService.openapi.paths;
    for (const path in paths) {
      const methods = paths[path];
      for (const method in methods) {
        const operation = methods[method];

        const generatedPath = await MockerUtils.generatePath(path, Parameter.arrayFrom(operation.parameters, newService.openapi), newService.openapi);
        const responsesCodes = Object.keys(operation.responses)
        for (const index in responsesCodes) {
            // add endpoint to db
            const code = responsesCodes[index]
            
            let content
            if (operation.responses[code].content){
              // use defined example if exists
              if ( operation.responses[code].content['application/json']['example'])
                content = operation.responses[code].content['application/json']['example']
              else if (operation.responses[code].content['application/json']['examples'])
                content = MockerUtils.fetchDefinedExample(operation.responses[code].content['application/json']['examples'], newService.openapi)
              else {
                if (process.env['AI_GENERATION_ENABLED'] == "true") {
                  const aiSample = {
                    [path]: {
                      [method]: {...operation, responses: operation.responses[code]}
                    }
                  }
                  try {
                    content = await MockerUtils.generateExampleWithAI(aiSample, newService.openapi)
                  } catch (error) {
                    // if error is caught in the AI generation, we generate the example in the basic way 
                    console.error(error.message);
                    const schema = operation.responses[code].content['application/json'].schema;
                    content = MockerUtils.generateExample(schema, newService.openapi)  
                  }
                  
                } else {
                  const schema = operation.responses[code].content['application/json'].schema;
                  content = MockerUtils.generateExample(schema, newService.openapi)
                }
              }
              
            } else  {
              content = {}
            }
          
            const response = {method, path: generatedPath, service: createdService._id, statusCode: Number.parseInt(code), content} as CreateResponseDto
            this.responseService.create(response)
        }
      };
    };

    
    return new MockerResponse(201, {
      message: "Service added successfully",
      service: {
        name: createdService.name,
        version: createdService.version
      }
    })    

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
