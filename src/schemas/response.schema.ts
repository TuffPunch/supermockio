
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Service } from './service.schema';

export type ResponseDocument = HydratedDocument<Response>;

@Schema()
export class Response {
  @Prop()
  statusCode: number;

  @Prop({ type: "object"})
  content: object;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Service' })
  service: Service;

}

export const ResponseSchema = SchemaFactory.createForClass(Response);