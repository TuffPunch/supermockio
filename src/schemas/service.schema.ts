
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ServiceDocument = HydratedDocument<Service>;

@Schema()
export class Service {
  @Prop()
  name: string;

  @Prop()
  version: string;

  @Prop({type: "object"})
  openapi: object;

}

export const ServiceSchema = SchemaFactory.createForClass(Service);