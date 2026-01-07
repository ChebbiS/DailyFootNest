import { IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateStatisticDto {
    @IsOptional()
    @IsNumber()
    @Min(0)
    goals?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    assists?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    yellowCards?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    redCards?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    matchesPlayed?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    minutesPlayed?: number; // Nouvelle stat potentielle

    @IsOptional()
    @IsNumber()
    @Min(0)
    height?: number; // cm

    @IsOptional()
    @IsNumber()
    @Min(0)
    weight?: number; // kg

    @IsOptional()
    @IsNumber()
    @Min(0)
    rating?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    shotsTotal?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    shotsOnTarget?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    passesTotal?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    passesKey?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    passesAccuracy?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    tacklesTotal?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    blocks?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    interceptions?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    duelsTotal?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    duelsWon?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    dribblesAttempts?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    dribblesSuccess?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    foulsCommitted?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    foulsDrawn?: number;
}
