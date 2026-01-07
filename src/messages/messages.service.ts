import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageStatus } from '@prisma/client';

@Injectable()
export class MessagesService {
    constructor(private prisma: PrismaService) { }

    async create(createMessageDto: CreateMessageDto) {
        return this.prisma.message.create({
            data: {
                firstName: createMessageDto.firstName,
                lastName: createMessageDto.lastName,
                email: createMessageDto.email,
                subject: createMessageDto.subject,
                content: createMessageDto.content,
                status: MessageStatus.NEW,
            },
        });
    }

    async findAll() {
        return this.prisma.message.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async updateStatus(id: number, status: MessageStatus) {
        const message = await this.prisma.message.findUnique({ where: { id } });
        if (!message) {
            throw new NotFoundException(`Message with ID ${id} not found`);
        }
        return this.prisma.message.update({
            where: { id },
            data: { status },
        });
    }
}
