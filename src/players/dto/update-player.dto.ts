import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePlayerDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsNumber()
    age?: number;

    @IsOptional()
    @IsString()
    nationality?: string;

    @IsOptional()
    @IsString()
    poste?: string;

    @IsOptional()
    @IsString()
    club?: string;

    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsNumber()
    height?: number;

    @IsOptional()
    @IsNumber()
    weight?: number;
}
