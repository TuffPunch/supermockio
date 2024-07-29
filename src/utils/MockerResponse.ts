import { ApiProperty } from "@nestjs/swagger"

export class MockerResponse{
    @ApiProperty()
    status: number
    @ApiProperty()
    message: any

    public constructor(status: number, message: any){
        this.status = status
        this.message = message
    }
}