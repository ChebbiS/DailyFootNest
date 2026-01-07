import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Role, OwnerType } from '@prisma/client';

@Injectable()
export class EventsService {
    constructor(private prisma: PrismaService) { }

    async create(createEventDto: CreateEventDto, userId: number, userRole: Role) {
        // Déterminer le ownerType et ownerId
        let ownerType: OwnerType;
        let ownerId: number;

        if (userRole === Role.AGENT) {
            const agent = await this.prisma.agent.findUnique({ where: { userId } });
            if (!agent) throw new NotFoundException('Agent not found');

            // Si l'agent crée pour un joueur spécifié
            if (createEventDto.targetPlayerId) {
                // Vérifier que le joueur appartient à l'agent
                const player = await this.prisma.player.findFirst({
                    where: { id: createEventDto.targetPlayerId, agentId: agent.id }
                });
                if (!player) throw new ForbiddenException('You can only create events for your players');

                ownerType = OwnerType.PLAYER;
                ownerId = player.id;
            } else {
                // Sinon c'est pour l'agent lui-même
                ownerType = OwnerType.AGENT;
                ownerId = agent.id;
            }
        } else {
            // C'est un Joueur
            const player = await this.prisma.player.findUnique({ where: { userId } });
            if (!player) throw new NotFoundException('Player not found');

            ownerType = OwnerType.PLAYER;
            ownerId = player.id;
        }

        // Trouver ou créer l'agenda correspondant
        // (En théorie créé à l'inscription, mais par sécurité on findOrCreate)
        let agenda = await this.prisma.agenda.findUnique({
            where: {
                ownerType_ownerId: { ownerType, ownerId }
            }
        });

        if (!agenda) {
            agenda = await this.prisma.agenda.create({
                data: { ownerType, ownerId, color: '#3788d8' }
            });
        }

        // Créer l'événement
        return this.prisma.event.create({
            data: {
                title: createEventDto.title,
                description: createEventDto.description,
                dateHeureDebut: new Date(createEventDto.dateHeureDebut),
                dateHeureFin: new Date(createEventDto.dateHeureFin),
                ownerType,
                ownerId,
                agendaId: agenda.id,
            },
        });
    }

    async findAll(userId: number, userRole: Role) {
        if (userRole === Role.AGENT) {
            // L'agent voit ses événements ET ceux de ses joueurs
            const agent = await this.prisma.agent.findUnique({
                where: { userId },
                include: { players: { select: { id: true, name: true } } }
            });
            if (!agent) throw new NotFoundException('Agent not found');

            const playerIds = agent.players.map(p => p.id);

            // Fetch events where owner is Agent OR owner IN players
            const events = await this.prisma.event.findMany({
                where: {
                    OR: [
                        { ownerType: OwnerType.AGENT, ownerId: agent.id },
                        { ownerType: OwnerType.PLAYER, ownerId: { in: playerIds } }
                    ]
                },
                include: {
                    agenda: { select: { color: true } }
                },
                orderBy: { dateHeureDebut: 'asc' }
            });

            // Enrichir avec le nom du joueur pour l'affichage frontend si besoin
            // Pour l'instant on retourne brut, le frontend gérera l'affichage (couleur diff ?)
            return events;

        } else {
            // Le joueur ne voit que ses événements
            const player = await this.prisma.player.findUnique({ where: { userId } });
            if (!player) throw new NotFoundException('Player not found');

            return this.prisma.event.findMany({
                where: { ownerType: OwnerType.PLAYER, ownerId: player.id },
                include: { agenda: { select: { color: true } } },
                orderBy: { dateHeureDebut: 'asc' }
            });
        }
    }

    async findOne(id: number, userId: number, userRole: Role) {
        const event = await this.prisma.event.findUnique({ where: { id } });
        if (!event) throw new NotFoundException('Event not found');

        // Check permissions
        await this.checkPermission(event, userId, userRole);

        return event;
    }

    async update(id: number, updateEventDto: UpdateEventDto, userId: number, userRole: Role) {
        const event = await this.prisma.event.findUnique({ where: { id } });
        if (!event) throw new NotFoundException('Event not found');

        await this.checkPermission(event, userId, userRole);

        return this.prisma.event.update({
            where: { id },
            data: {
                ...updateEventDto,
                dateHeureDebut: updateEventDto.dateHeureDebut ? new Date(updateEventDto.dateHeureDebut) : undefined,
                dateHeureFin: updateEventDto.dateHeureFin ? new Date(updateEventDto.dateHeureFin) : undefined,
            },
        });
    }

    async remove(id: number, userId: number, userRole: Role) {
        const event = await this.prisma.event.findUnique({ where: { id } });
        if (!event) throw new NotFoundException('Event not found');

        await this.checkPermission(event, userId, userRole);

        return this.prisma.event.delete({ where: { id } });
    }

    private async checkPermission(event: any, userId: number, userRole: Role) {
        if (userRole === Role.AGENT) {
            const agent = await this.prisma.agent.findUnique({
                where: { userId },
                include: { players: { select: { id: true } } }
            });
            if (!agent) throw new ForbiddenException('Agent profile missing');

            // Agent owns event directly OR agent manages the player who owns it
            const isOwner = event.ownerType === OwnerType.AGENT && event.ownerId === agent.id;
            const isManager = event.ownerType === OwnerType.PLAYER && agent.players.some(p => p.id === event.ownerId);

            if (!isOwner && !isManager) {
                throw new ForbiddenException('You do not have permission to access this event');
            }
        } else {
            // Player must own the event
            const player = await this.prisma.player.findUnique({ where: { userId } });
            if (!player) throw new ForbiddenException('Player profile missing');

            if (event.ownerType !== OwnerType.PLAYER || event.ownerId !== player.id) {
                throw new ForbiddenException('You do not have permission to access this event');
            }
        }
    }
}
