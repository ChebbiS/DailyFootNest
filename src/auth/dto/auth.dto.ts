import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsInt } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;
}

export class RegisterPlayerDto extends RegisterDto {
    @IsInt()
    agentId: number;

    @IsInt()
    age: number;

    @IsString()
    nationality: string;

    @IsString()
    poste: string;

    @IsString()
    club: string;

    @IsOptional()
    @IsString()
    image?: string;
}

export class LoginDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

export class AuthResponseDto {
    access_token: string;
    user: {
        id: number;
        email: string;
        name: string;
        role: Role;
    };
}
