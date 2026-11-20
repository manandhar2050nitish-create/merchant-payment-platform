
import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
} from 'class-validator';

export class ApplicationDTO {

    @ApiProperty({ example: 'my_business_name', description: 'Business name' })
    @IsString()
    @IsNotEmpty()
    business_name: string;

    @ApiProperty({ example: 'my_legal_business_name', description: 'Legal business name' })
    @IsString()
    @IsNotEmpty()
    legal_business_name: string;

    @ApiProperty({ example: 'RETAIL', description: 'Business type' })
    @IsString()
    @IsNotEmpty()
    business_type: string;

    @ApiProperty({ example: 'Kathmandu Nepal', description: 'Contact information' })
    @IsString()
    @IsNotEmpty()
    contact_information: string;

    @ApiProperty({ example: 'Business is involved with banks', description: 'Requested processing information' })
    @IsString()
    @IsNotEmpty()
    requested_processing_information: string;
}
