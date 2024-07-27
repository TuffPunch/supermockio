import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { createServiceDto } from 'src/dtos/createServiceDto';
import { Service } from 'src/schemas/service.schema';


@Injectable()
export class ServiceService {
  constructor(@InjectModel(Service.name) private readonly serviceModel: Model<Service>) {}

  async create(createServiceDto: createServiceDto): Promise<Service> {
    const createdService = await this.serviceModel.create(createServiceDto);
  
    return createdService;
  }

  async findAll(): Promise<Service[]> {
    return this.serviceModel.find().exec();
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
}