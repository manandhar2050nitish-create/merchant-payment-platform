import { HttpException, HttpStatus } from "@nestjs/common";

export class UserNotFoundException extends HttpException{
   constructor(){
    super({
        message: 'Could not find user!!!',
        code: 'NOT_FOUND',
    }, HttpStatus.NOT_FOUND);
   }
}