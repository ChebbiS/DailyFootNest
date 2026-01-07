import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @IsString()
    @MinLength(1, { message: 'Le mot de passe actuel est requis' })
    currentPassword: string;

    @IsString()
    @MinLength(6, { message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' })
    newPassword: string;
}
