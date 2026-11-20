import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UserRequestDTO } from '../dto/UserRequestDTO.js';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';


@ApiTags('Authentication')
@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService){}
    @ApiOperation({ summary: 'Authenticate a user and return a JWT' })
    @ApiBody({ type: UserRequestDTO })
    @ApiResponse({ status: 200, description: 'Successfully authenticated. Returns a JWT token.' })
    @ApiResponse({ status: 401, description: 'Invalid username or password.' })
    @HttpCode(HttpStatus.OK)
    @Post('/login')
    public async loginUser(@Body() body: UserRequestDTO): Promise<string>{
        return await this.authService.validateUser(body.username, body.password);
    }

}
