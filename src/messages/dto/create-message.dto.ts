import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateMessageDto {
    @IsNotEmpty({ message: 'Le prénom est requis' })
    @IsString()
    firstName: string;

    @IsNotEmpty({ message: 'Le nom est requis' })
    @IsString()
    lastName: string;

    @IsNotEmpty({ message: "L'email est requis" })
    @IsEmail({}, { message: 'Email invalide' })
    email: string;

    @IsNotEmpty({ message: 'Le sujet est requis' })
    @IsString()
    subject: string;

    @IsNotEmpty({ message: 'Le message est requis' })
    @IsString()
    @MinLength(10, { message: 'Le message doit contenir au moins 10 caractères' })
    content: string;
}
