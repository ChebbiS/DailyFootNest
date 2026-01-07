import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PlayersService {
    constructor(private prisma: PrismaService) { }

    async create(createPlayerDto: CreatePlayerDto, agentId: number) {
        // 1. Vérifier si l'email existe déjà
        const existingUser = await this.prisma.user.findUnique({
            where: { email: createPlayerDto.email },
        });

        if (existingUser) {
            throw new ConflictException('Un utilisateur avec cet email existe déjà.');
        }

        // 2. Générer un mot de passe aléatoire
        const rawPassword = Math.random().toString(36).slice(-8); // simple random string
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // 3. Transaction pour tout créer d'un coup
        try {
            return await this.prisma.$transaction(async (prisma) => {
                console.log('Starting transaction for player creation...');

                // Créer le User
                const user = await prisma.user.create({
                    data: {
                        name: createPlayerDto.name,
                        email: createPlayerDto.email,
                        password: hashedPassword,
                        role: 'PLAYER',
                    },
                });
                console.log('User created:', user.id);

                // Créer le Player lié
                const player = await prisma.player.create({
                    data: {
                        name: createPlayerDto.name,
                        age: createPlayerDto.age,
                        nationality: createPlayerDto.nationality,
                        poste: createPlayerDto.poste,
                        club: createPlayerDto.club,
                        email: createPlayerDto.email,
                        image: createPlayerDto.image || null,
                        agentId: agentId,
                        userId: user.id,
                    },
                });
                console.log('Player created:', player.id);

                // Créer les Stats initiales
                await prisma.statistic.create({
                    data: {
                        playerId: player.id,
                        season: '2025/2026',
                        goals: 0,
                        assists: 0,
                        yellowCards: 0,
                        redCards: 0,
                        matchesPlayed: 0,
                        height: createPlayerDto.height ? Number(createPlayerDto.height) : 0,
                        weight: createPlayerDto.weight ? Number(createPlayerDto.weight) : 0,
                    },
                });
                console.log('Stats created');

                // Créer l'Agenda initial
                const agenda = await prisma.agenda.create({
                    data: {
                        ownerType: 'PLAYER',
                        ownerId: player.id,
                        color: '#FF5733',
                    },
                });
                console.log('Agenda created');

                // Ajouter un événement par défaut
                await prisma.event.create({
                    data: {
                        agendaId: agenda.id,
                        title: 'Bienvenue sur DailyFoot',
                        description: 'Ceci est votre premier événement.',
                        dateHeureDebut: new Date(),
                        dateHeureFin: new Date(new Date().getTime() + 60 * 60 * 1000), // +1h
                        ownerType: 'PLAYER',
                        ownerId: player.id,
                    },
                });

                console.log(`[ACCESS] Password for ${player.email}: ${rawPassword}`);

                return player;
            });
        } catch (e) {
            console.error('Error creating player:', e);
            // Re-throw as BadRequestException to see message in frontend
            throw new ConflictException(`Failed to create player: ${e.message}`);
        }
    }

    async findAllByAgent(agentUserId: number) {
        const agent = await this.prisma.agent.findUnique({
            where: { userId: agentUserId }
        });
        if (!agent) throw new NotFoundException('Agent not found');

        return this.prisma.player.findMany({
            where: { agentId: agent.id },
            include: {
                user: { select: { email: true, name: true } },
                statistics: true,
            },
        });
    }

    async findOne(id: number) {
        const player = await this.prisma.player.findUnique({
            where: { id },
            include: {
                statistics: true,
                user: { select: { email: true, name: true } },
            },
        });
        if (!player) throw new NotFoundException(`Player #${id} not found`);
        return player;
    }

    async update(id: number, updatePlayerDto: UpdatePlayerDto) {
        return this.prisma.player.update({
            where: { id },
            data: {
                ...updatePlayerDto,
            },
        });
    }

    async updateNotes(id: number, notes: string) {
        return this.prisma.player.update({
            where: { id },
            data: { notes: notes },
        });
    }

    async remove(id: number) {
        // Le delete cascade de Prisma (si configuré) ou manuel
        // User delete cascade ? Dans schema.prisma "onDelete: Cascade" est mieux.
        // Ici on va supprimer le User, ce qui devrait trigger la suppression du player

        const player = await this.prisma.player.findUnique({ where: { id } });
        if (!player) throw new NotFoundException('Player not found');

        // Supprimer le user associé (ce qui supprimera le player via relation si configuré, sinon error)
        // Vérifions le schema.prisma : 
        // model Agent { user User ... } -> il faut voir la relation.
        // Si pas de cascade, on supprime manuellement.

        return this.prisma.$transaction(async (prisma) => {
            // Suppresion dépendances
            await prisma.statistic.deleteMany({ where: { playerId: id } });
            await prisma.event.deleteMany({ where: { ownerType: 'PLAYER', ownerId: id } });
            await prisma.agenda.deleteMany({ where: { ownerType: 'PLAYER', ownerId: id } });

            const deletedPlayer = await prisma.player.delete({ where: { id } });
            await prisma.user.delete({ where: { id: player.userId } }); // Supprime le compte user

            return deletedPlayer;
        });
    }

    async getCurrentAgentId(userId: number): Promise<number> {
        const agent = await this.prisma.agent.findUnique({ where: { userId } });
        if (!agent) throw new NotFoundException('Agent profile not found');
        return agent.id;
    }
}
