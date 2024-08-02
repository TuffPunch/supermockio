import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { createServiceDto } from 'src/dtos/createServiceDto';
import { Service } from 'src/schemas/service.schema';
import { ResponseService } from './response.service';
import { CreateResponseDto } from 'src/dtos/createResponseDto';
import { MockerUtils, Parameter } from 'src/utils/MockerUtils';


@Injectable()
export class ServiceService {

  constructor(@InjectModel(Service.name) private readonly serviceModel: Model<Service>,private readonly responseService: ResponseService) {

  }

  async create(createServiceDto: createServiceDto): Promise<Service> {
    const createdService = await this.serviceModel.create(createServiceDto);
  
    return createdService;
  }

  async findAll(): Promise<Service[]> {
    return this.serviceModel.find().select(
      ["name", "version", "description", "openapi"]
    );
  }

  async findOne(id: string): Promise<Service> {
    return this.serviceModel.findOne({ _id: id }).exec();
  }


  async findOneByName(name: string): Promise<Service> {
    return (await this.serviceModel.findOne({ name: name }).exec());
  }
  
  async findOneByNameAndVersion(name: string, version: string): Promise<Service> {
    return (await this.serviceModel.findOne({ name, version }).exec());
  }

  async delete(id: Types.ObjectId) {
    const deletedCat = await this.serviceModel
      .findByIdAndDelete({ _id: id })
      .exec();
    return deletedCat;
  }

  async createServiceResponses(createdService: Service){
    const paths = createdService.openapi['paths'];
    for (const path in paths) {
      const methods = paths[path];
      for (const method in methods) {
        const operation = methods[method];

        const generatedPath = await MockerUtils.generatePath(path, Parameter.arrayFrom(operation.parameters, createdService.openapi), createdService.openapi);
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
                content = MockerUtils.fetchDefinedExample(operation.responses[code].content['application/json']['examples'], createdService.openapi)
              else {
                if (process.env['AI_GENERATION_ENABLED'] == "true") {
                  const aiSample = {
                    [path]: {
                      [method]: {...operation, responses: operation.responses[code]}
                    }
                  }
                  try {
                    content = await MockerUtils.generateExampleWithAI(aiSample, createdService.openapi)
                  } catch (error) {
                    // if error is caught in the AI generation, we generate the example in the basic way 
                    console.error(error.message);
                    const schema = operation.responses[code].content['application/json'].schema;
                    content = MockerUtils.generateExample(schema, createdService.openapi)  
                  }
                  
                } else {
                  const schema = operation.responses[code].content['application/json'].schema;
                  content = MockerUtils.generateExample(schema, createdService.openapi)
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
  }
}