
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument, Types } from 'mongoose';

export type ServiceDocument = HydratedDocument<Service>;

@Schema()
export class Service {

  _id: Types.ObjectId

  @ApiProperty()
  @Prop()
  name: string;

  @ApiProperty()
  @Prop()
  version: string;

  @ApiProperty()
  @Prop()
  description: string;

  @ApiProperty()
  @Prop({type: "object"})
  openapi: object;

  constructor(id, name, version, description, openapi){
    this._id = id
    this.name = name
    this.openapi = openapi
    this.version = version
    this.description = description
  }
  
}

export const ServiceSchema = SchemaFactory.createForClass(Service);