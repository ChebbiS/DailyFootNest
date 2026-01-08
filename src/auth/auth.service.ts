import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, RegisterPlayerDto, LoginDto, AuthResponseDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Role } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private mailService: MailService,
    ) { }

    async invitePlayer(agentIdOrUserId: number, dto: RegisterPlayerDto) {
        // Try to find agent by ID first (for ADMIN providing agentId)
        let agent = await this.prisma.agent.findUnique({
            where: { id: agentIdOrUserId },
        });

        // If not found, try to find by userId (for AGENT users)
        if (!agent) {
            agent = await this.prisma.agent.findUnique({
                where: { userId: agentIdOrUserId },
            });
        }

        if (!agent) {
            throw new BadRequestException('Agent introuvable');
        }

        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new ConflictException('Cet email est déjà utilisé');
        }

        // Generate invitation token
        const invitationToken = randomBytes(32).toString('hex');
        const generatedPassword = randomBytes(8).toString('hex'); // Temporary
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        // Transaction: Create User & Player
        await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name: dto.name,
                    email: dto.email,
                    password: hashedPassword,
                    role: Role.PLAYER,
                    isActive: false, // Inactive until invitation accepted
                    invitationToken,
                    invitationExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
                },
            });

            await tx.player.create({
                data: {
                    userId: user.id,
                    agentId: agent.id,
                    name: dto.name,
                    age: dto.age,
                    nationality: dto.nationality,
                    poste: dto.poste,
                    club: dto.club,
                    email: dto.email,
                    image: dto.image,
                },
            });
        });

        // Send Email
        await this.mailService.sendInvitation(dto.email, invitationToken);
    }

    async resendInvitation(email: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });

        if (!user) throw new NotFoundException('Utilisateur inconnu');
        if (user.isActive) throw new BadRequestException('Ce compte est déjà actif');

        // Regenerate token
        const invitationToken = randomBytes(32).toString('hex');

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                invitationToken,
                invitationExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
            }
        });

        await this.mailService.sendInvitation(email, invitationToken);
        return { message: 'Invitation renvoyée' };
    }

    async verifyInvitation(token: string) {
        const user = await this.prisma.user.findUnique({
            where: { invitationToken: token },
        });

        if (!user || user.invitationExpiresAt < new Date()) {
            throw new BadRequestException('Token invalide ou expiré');
        }

        return { email: user.email, name: user.name };
    }

    async completeRegistration(token: string, password: string) {
        const user = await this.prisma.user.findUnique({
            where: { invitationToken: token },
        });

        if (!user || user.invitationExpiresAt < new Date()) {
            throw new BadRequestException('Token invalide ou expiré');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                isActive: true, // Activate user
                invitationToken: null,
                invitationExpiresAt: null,
            },
        });

        // Auto login
        const payload = { sub: user.id, email: user.email, role: user.role };
        const userProfile = await this.validateUser(user.id);

        return {
            access_token: this.jwtService.sign(payload),
            user: userProfile
        };
    }

    async forgotPassword(email: string) {
        console.log(`Forgot password requested for: ${email}`);
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log(`User not found for email: ${email}`);
            return;
        }

        const token = randomBytes(32).toString('hex');
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: token,
                resetPasswordExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
            },
        });

        await this.mailService.sendPasswordReset(email, token);
    }

    async resetPassword(token: string, password: string) {
        const user = await this.prisma.user.findUnique({
            where: { resetPasswordToken: token }
        });

        if (!user || !user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
            throw new BadRequestException('Token invalide ou expiré');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpiresAt: null,
            },
        });
    }

    async register(registerDto: RegisterDto, role: Role): Promise<AuthResponseDto> {
        try {
            // Check if user already exists
            const existingUser = await this.prisma.user.findUnique({
                where: { email: registerDto.email },
            });

            if (existingUser) {
                throw new ConflictException('Un utilisateur avec cet email existe déjà');
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(registerDto.password, 10);

            // Create user
            const user = await this.prisma.user.create({
                data: {
                    name: registerDto.name,
                    email: registerDto.email,
                    password: hashedPassword,
                    role,
                    isActive: true,
                },
            });

            // Create Agent if role is AGENT
            if (role === Role.AGENT) {
                await this.prisma.agent.create({
                    data: {
                        userId: user.id,
                    },
                });
            }

            // Generate JWT token
            const payload = { sub: user.id, email: user.email, role: user.role };
            const access_token = this.jwtService.sign(payload);
            const userProfile = await this.validateUser(user.id);

            return {
                access_token,
                user: userProfile,
            };
        } catch (error) {
            console.error("Registration Error Details:", error);
            throw error;
        }
    }

    async registerPlayer(registerPlayerDto: RegisterPlayerDto): Promise<AuthResponseDto> {
        // Verify agent exists
        const agent = await this.prisma.agent.findUnique({
            where: { id: registerPlayerDto.agentId },
        });

        if (!agent) {
            throw new BadRequestException('Agent introuvable');
        }

        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: registerPlayerDto.email },
        });

        if (existingUser) {
            throw new ConflictException('Un utilisateur avec cet email existe déjà');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(registerPlayerDto.password, 10);

        // Create user and player in a transaction
        const result = await this.prisma.$transaction(async (prisma) => {
            const user = await prisma.user.create({
                data: {
                    name: registerPlayerDto.name,
                    email: registerPlayerDto.email,
                    password: hashedPassword,
                    role: Role.PLAYER,
                },
            });

            await prisma.player.create({
                data: {
                    userId: user.id,
                    agentId: registerPlayerDto.agentId,
                    name: registerPlayerDto.name,
                    age: registerPlayerDto.age,
                    nationality: registerPlayerDto.nationality,
                    poste: registerPlayerDto.poste,
                    club: registerPlayerDto.club,
                    email: registerPlayerDto.email,
                    image: registerPlayerDto.image,
                },
            });

            return user;
        });

        // Generate JWT token
        const payload = { sub: result.id, email: result.email, role: result.role };
        const access_token = this.jwtService.sign(payload);
        const userProfile = await this.validateUser(result.id);

        return {
            access_token,
            user: userProfile,
        };
    }

    async login(loginDto: LoginDto): Promise<AuthResponseDto> {
        // Find user by email
        const user = await this.prisma.user.findUnique({
            where: { email: loginDto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Email ou mot de passe incorrect');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Email ou mot de passe incorrect');
        }

        if (user.isActive === false) {
            throw new UnauthorizedException('Votre compte a été désactivé. Veuillez contacter l\'administrateur.');
        }

        // Generate JWT token
        const payload = { sub: user.id, email: user.email, role: user.role };
        const access_token = this.jwtService.sign(payload);
        const userProfile = await this.validateUser(user.id);

        return {
            access_token,
            user: userProfile,
        };
    }

    async validateUser(userId: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                player: {
                    select: {
                        id: true,
                        name: true,
                        age: true,
                        nationality: true,
                        poste: true,
                        club: true,
                        image: true,
                    }
                },
                agent: {
                    select: {
                        id: true,
                    }
                }
            },
        });

        if (!user) {
            throw new UnauthorizedException('Utilisateur non trouvé');
        }

        // Format response to include playerProfile or agentProfile
        const response: any = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
        };

        if (user.player) {
            response.playerProfile = user.player;
        }

        if (user.agent) {
            response.agentProfile = user.agent;
        }

        return response;
    }
}
