import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async updateProfile(userId: number, dto: UpdateProfileDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('Utilisateur non trouvé');

        return this.prisma.user.update({
            where: { id: userId },
            data: {
                name: dto.name,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            }
        });
    }

    async changePassword(userId: number, dto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('Utilisateur non trouvé');

        // Verify current password
        const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isMatch) {
            throw new BadRequestException('Le mot de passe actuel est incorrect');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
            },
        });

        return { message: 'Mot de passe modifié avec succès' };
    }

    async updateAvatar(userId: number, avatarUrl: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { avatar: avatarUrl },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
            }
        });
    }

    // Admin Methods
    async findAll(page: number = 1, limit: number = 10, search: string = '') {
        const skip = (page - 1) * limit;
        const where = search ? {
            OR: [
                { name: { contains: search } },
                { email: { contains: search } },
            ]
        } : {};

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    avatar: true,
                    isActive: true,
                    createdAt: true,
                }
            }),
            this.prisma.user.count({ where })
        ]);

        return {
            data: users,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            }
        };
    }

    async updateUserStatus(userId: number, isActive: boolean) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { isActive },
        });
    }

    async updateUserAdmin(userId: number, data: { name?: string; email?: string; role?: any }) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                name: data.name,
                email: data.email,
                role: data.role,
            },
        });
    }
}
