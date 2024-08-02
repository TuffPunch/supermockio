import { Controller, Get, Param, Query, Render, Res } from '@nestjs/common';
import axios from 'axios';
import { ResponseService } from 'src/services/response.service';
import { ServiceService } from 'src/services/service.service';
import { Document } from 'yaml';
import { Response } from 'express';


@Controller()
export class ViewsController {
  constructor(private readonly serviceService: ServiceService, private readonly responseService: ResponseService) { }
  @Get()
  @Render('index')
  getHome(): object {
    return {};
  }

  @Get("/services")
  @Render('services')
  async getServices(): Promise<object> {
    const services = await this.serviceService.findAll()
    return { services };
  }

  @Get("/documentations/:name/:version")
  @Render("openapi")
  async getServiceDocument(@Param() params: string[]) {
    const service = await this.serviceService.findOneByNameAndVersion(params['name'], params['version'])
    const contract = new Document(service.openapi)

    return { openapi: contract.toString() }
  }

  @Get("/services/:name/:version/")
  @Render("service")
  async getServiceMock(@Param() params: string[]) {
    const service = await this.serviceService.findOneByNameAndVersion(params['name'], params['version'])
    const responses = await this.responseService.findByService(service._id)

    return { responses, service }

  }

  @Get("/mocks")
  async forwardToMock(@Query() query: string[], @Res() res: Response) {
    const request = {
      path: query['path'],
      method: query["method"],
      name: query["name"],
      version: query["version"],
      statusCode: query["statusCode"]
    }

    axios.defaults.validateStatus = () => {
      // Allow any status code (you can customize this logic as needed)
      return true;
    };

    const mockResponse = await axios.request({
      method: request.method,
      baseURL: 'http://localhost:3000',
      url: `/api/mocks/${request.name}/${request.version}${request.path}`,
      headers: {
        "X-SuperMockio-Status": request.statusCode
      }
    })

    res.status(mockResponse.status).send(mockResponse.data)
  }

} 