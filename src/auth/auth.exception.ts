import { HttpException, HttpStatus } from "@nestjs/common";

export class AuthenticationException extends HttpException{
   constructor(){
    super({
        message: 'Could not Authenticate user!!!',
        code: 'UNAUTHORIZED',
    }, HttpStatus.UNAUTHORIZED);
   }
}