
export class MockerResponse{
    status: number
    message: any

    public constructor(status: number, message: any){
        this.status = status
        this.message = message
    }
}