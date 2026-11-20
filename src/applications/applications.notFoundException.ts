import { HttpException, HttpStatus } from "@nestjs/common";

export class ApplicationNotFound extends HttpException{
   constructor(){
    super({
        message: 'Could not find Applicatoin!!!',
        code: 'NOT_FOUND',
    }, HttpStatus.NOT_FOUND);
   }
}