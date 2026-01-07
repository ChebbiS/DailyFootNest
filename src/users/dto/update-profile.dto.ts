import { IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateProfileDto {
    @IsString()
    @MinLength(2)
    @IsOptional()
    name?: string;

    // Email is intentionally excluded to prevent updates
}
