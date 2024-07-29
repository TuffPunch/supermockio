
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Service } from './service.schema';
import { ApiProperty } from '@nestjs/swagger';

export type ResponseDocument = HydratedDocument<Response>;

@Schema()
export class Response {
  @ApiProperty()
  @Prop()
  statusCode: number;

  @ApiProperty()
  @Prop({ type: "object"})
  content: object;

  @ApiProperty()
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Service' })
  service: Service;

  @ApiProperty()
  @Prop()
  path: string
  
  @ApiProperty()
  @Prop()
  method: string

}

export const ResponseSchema = SchemaFactory.createForClass(Response);