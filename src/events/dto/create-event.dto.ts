import { IsString, IsNotEmpty, IsDateString, IsOptional, IsEnum, IsNumber, IsHexColor } from 'class-validator';

export class CreateEventDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty()
    @IsDateString()
    dateHeureDebut: string;

    @IsNotEmpty()
    @IsDateString()
    dateHeureFin: string;

    @IsOptional()
    @IsHexColor()
    color?: string; // Optionnel, pour override la couleur de l'agenda

    // Si c'est un agent qui crée pour un joueur
    @IsOptional()
    @IsNumber()
    targetPlayerId?: number;
}
