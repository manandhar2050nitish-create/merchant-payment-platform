import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserRequestDTO {

    @ApiProperty({ example: 'test_sales_1', description: 'User login name' })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ example: 'test_password', description: 'User password' })
    @IsString()
    @IsNotEmpty()
    password: string;
}