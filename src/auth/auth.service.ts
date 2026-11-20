import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity.js';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthenticationException } from './auth.exception.js';
import { JwtService } from '@nestjs/jwt';
import { UserNotFoundException } from './auth.not-found.exception.js';



@Injectable()
export class AuthService {
   
    constructor(@InjectRepository(User) private userRepo: Repository<User>, private jwtService: JwtService){}

    async validateUser(username:string, password:string):Promise<string>{
 
        const userDetails: User|null = await this.userRepo.createQueryBuilder('user').leftJoinAndSelect('user.role', 'role')
        .where("user.username= :username", {username}).getOne();
        if(userDetails === null){
            throw new UserNotFoundException();
        }

        //get the hashed password from the username
        const passwordHash:string|undefined = userDetails?.password;
    
        const result = await bcrypt.compare(password, passwordHash as string);
   
        //if result passed then generate the JWT and return result
        if(result){
            //generate JWT
            return this.jwtService.sign({
                sub: userDetails.id,
                username: userDetails.username,
                role: userDetails.role.role
            });
        }
        throw new AuthenticationException(); 
    }
}
