import { Service } from "src/schemas/service.schema";
import { createServiceDto } from "./createServiceDto";
import mongoose from "mongoose";

export class createResponseDto {
    statusCode: number;
    content: object;
    service: createServiceDto | Service | mongoose.Types.ObjectId
 }