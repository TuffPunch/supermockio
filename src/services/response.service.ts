import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createResponseDto } from 'src/dtos/createResponseDto';
import { Response } from 'src/schemas/response.schema';



@Injectable()
export class ResponseService {
  constructor(@InjectModel(Response.name) private readonly responseModel: Model<Response>) {}

  async create(createResponseDto: createResponseDto): Promise<Response> {
    const createdResponse = await this.responseModel.create(createResponseDto);
    return createdResponse;
  }

  async findAll(): Promise<Response[]> {
    return this.responseModel.find().exec();
  }

  async findOne(id: string): Promise<Response> {
    return this.responseModel.findOne({ _id: id }).populate('service', ["name"]).exec();
  }

  async findOneByNamePopulated(name: number): Promise<Response> {
    return (await this.responseModel.findOne({ statusCode: name }).populate("service").exec());
  }

  async delete(id: string) {
    const deletedCat = await this.responseModel
      .findByIdAndDelete({ _id: id })
      .exec();
    return deletedCat;
  }
}