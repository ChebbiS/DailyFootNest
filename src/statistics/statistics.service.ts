import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStatisticDto } from './dto/update-statistic.dto';
import { Role } from '@prisma/client';

@Injectable()
export class StatisticsService {
    constructor(private prisma: PrismaService) { }

    // Obtenir les stats d'un joueur (par son ID de joueur)
    async findByPlayerId(playerId: number, userId: number, userRole: Role) {
        // Vérification des droits
        if (userRole === Role.AGENT) {
            // L'agent doit posséder le joueur
            const agent = await this.prisma.agent.findUnique({
                where: { userId },
                include: { players: true }
            });
            if (!agent || !agent.players.some(p => p.id === playerId)) {
                throw new ForbiddenException('You cannot view stats for this player');
            }
        } else if (userRole === Role.PLAYER) {
            // Le joueur ne peut voir que ses propres stats
            const player = await this.prisma.player.findUnique({ where: { userId } });
            if (!player || player.id !== playerId) {
                throw new ForbiddenException('You cannot view stats for another player');
            }
        }

        let stats = await this.prisma.statistic.findFirst({
            where: { playerId }
        });

        // Si les stats n'existent pas, les créer automatiquement
        if (!stats) {
            stats = await this.prisma.statistic.create({
                data: {
                    playerId,
                    season: new Date().getFullYear().toString(),
                    matchesPlayed: 0,
                    minutesPlayed: 0,
                    rating: 0,
                    goals: 0,
                    assists: 0,
                    shotsTotal: 0,
                    shotsOnTarget: 0,
                    passesTotal: 0,
                    passesKey: 0,
                    passesAccuracy: 0,
                    tacklesTotal: 0,
                    blocks: 0,
                    interceptions: 0,
                    duelsTotal: 0,
                    duelsWon: 0,
                    dribblesAttempts: 0,
                    dribblesSuccess: 0,
                    foulsCommitted: 0,
                    foulsDrawn: 0,
                    height: 0,
                    weight: 0,
                    yellowCards: 0,
                    redCards: 0,
                }
            });
        }

        return stats;
    }

    // Mettre à jour les stats
    async update(id: number, updateStatisticDto: UpdateStatisticDto, userId: number, userRole: Role) {
        const stats = await this.prisma.statistic.findUnique({ where: { id }, include: { player: true } });
        if (!stats) throw new NotFoundException('Statistics not found');

        // Vérification des droits
        if (userRole === Role.AGENT) {
            // Vérifier que l'agent possède le joueur
            const agent = await this.prisma.agent.findUnique({ where: { userId } });
            if (!agent || stats.player.agentId !== agent.id) {
                throw new ForbiddenException('You cannot update stats for this player');
            }
        } else if (userRole === Role.PLAYER) {
            // Le joueur peut modifier ses propres stats
            const player = await this.prisma.player.findUnique({ where: { userId } });
            if (!player || stats.playerId !== player.id) {
                throw new ForbiddenException('You can only update your own stats');
            }
        } else {
            // Admin ? Ou autre
            // Pour l'instant on bloque si pas agent/player reconnu
            // Si on a un role ADMIN on pourrait laisser passer
        }

        return this.prisma.statistic.update({
            where: { id },
            data: updateStatisticDto,
        });
    }
}
