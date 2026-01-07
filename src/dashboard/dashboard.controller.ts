import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
    constructor(private prisma: PrismaService) { }

    @Get('agent/stats')
    async getAgentDashboardStats(@CurrentUser() user: any) {
        // Récupérer l'agent
        const agent = await this.prisma.agent.findUnique({
            where: { userId: user.id },
        });

        if (!agent) {
            throw new Error('Agent not found');
        }

        // Nombre de joueurs
        const playersCount = await this.prisma.player.count({
            where: { agentId: agent.id },
        });

        // Nombre d'événements à venir
        const upcomingEventsCount = await this.prisma.event.count({
            where: {
                ownerType: 'AGENT',
                ownerId: agent.id,
                dateHeureDebut: {
                    gte: new Date(),
                },
            },
        });

        // Événements récents (5 prochains)
        const upcomingEvents = await this.prisma.event.findMany({
            where: {
                OR: [
                    {
                        ownerType: 'AGENT',
                        ownerId: agent.id,
                    },
                    {
                        ownerType: 'PLAYER',
                        ownerId: {
                            in: (
                                await this.prisma.player.findMany({
                                    where: { agentId: agent.id },
                                    select: { id: true },
                                })
                            ).map((p) => p.id),
                        },
                    },
                ],
                dateHeureDebut: {
                    gte: new Date(),
                },
            },
            orderBy: {
                dateHeureDebut: 'asc',
            },
            take: 5,
        });

        // Joueurs récents (5 derniers ajoutés)
        const recentPlayers = await this.prisma.player.findMany({
            where: { agentId: agent.id },
            orderBy: {
                createdAt: 'desc',
            },
            take: 5,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return {
            playersCount,
            upcomingEventsCount,
            upcomingEvents,
            recentPlayers,
        };
    }

    @Get('player/stats')
    async getPlayerDashboardStats(@CurrentUser() user: any) {
        // Récupérer le joueur
        const player = await this.prisma.player.findUnique({
            where: { userId: user.id },
            include: {
                statistics: true,
                user: true,
            },
        });

        if (!player) {
            throw new Error('Player not found');
        }

        // Nombre d'événements à venir
        const upcomingEventsCount = await this.prisma.event.count({
            where: {
                ownerType: 'PLAYER',
                ownerId: player.id,
                dateHeureDebut: {
                    gte: new Date(),
                },
            },
        });

        // Événements récents (5 prochains)
        const upcomingEvents = await this.prisma.event.findMany({
            where: {
                ownerType: 'PLAYER',
                ownerId: player.id,
                dateHeureDebut: {
                    gte: new Date(),
                },
            },
            orderBy: {
                dateHeureDebut: 'asc',
            },
            take: 5,
        });

        // Statistiques
        const stats = player.statistics[0] || null;

        return {
            player: {
                id: player.id,
                name: player.name,
                email: player.email,
                club: player.club,
                poste: player.poste,
                nationality: player.nationality,
                age: player.age,
                image: player.image,
            },
            statistics: stats,
            upcomingEventsCount,
            upcomingEvents,
        };
    }

    @Get('admin/stats')
    async getAdminDashboardStats() {
        const agentsCount = await this.prisma.agent.count();
        const playersCount = await this.prisma.player.count();
        const messagesTotal = await this.prisma.message.count();
        const messagesNew = await this.prisma.message.count({ where: { status: 'NEW' } });
        const messagesResolved = await this.prisma.message.count({ where: { status: 'RESOLVED' } });

        const recentUsers = await this.prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                avatar: true,
            },
        });

        const recentMessages = await this.prisma.message.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
        });

        return {
            counts: {
                agents: agentsCount,
                players: playersCount,
                messages: {
                    total: messagesTotal,
                    new: messagesNew,
                    resolved: messagesResolved,
                },
            },
            recentActivity: {
                users: recentUsers,
                messages: recentMessages,
            },
        };
    }
}
