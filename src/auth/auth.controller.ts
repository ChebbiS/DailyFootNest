import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, RegisterPlayerDto, LoginDto, AuthResponseDto } from './dto/auth.dto';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register/agent')
    async registerAgent(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
        return this.authService.register(registerDto, Role.AGENT);
    }

    @Post('register/player')
    async registerPlayer(@Body() registerPlayerDto: RegisterPlayerDto): Promise<AuthResponseDto> {
        return this.authService.registerPlayer(registerPlayerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
        return this.authService.login(loginDto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@CurrentUser() user: any) {
        return user;
    }

    @Post('invite')
    @UseGuards(JwtAuthGuard)
    async invitePlayer(@CurrentUser() user: any, @Body() dto: RegisterPlayerDto) {
        // Allow both ADMIN and AGENT to invite players
        if (user.role !== Role.AGENT && user.role !== Role.ADMIN) {
            throw new UnauthorizedException('Seuls les agents et administrateurs peuvent inviter des joueurs');
        }

        // If user is ADMIN, use the agentId from the DTO
        // If user is AGENT, use their own userId
        const agentIdToUse = user.role === Role.ADMIN ? dto.agentId : user.id;

        return this.authService.invitePlayer(agentIdToUse, dto);
    }

    @Post('resend-invitation')
    @UseGuards(JwtAuthGuard)
    async resendInvitation(@Body() body: { email: string }) {
        return this.authService.resendInvitation(body.email);
    }

    @Post('verify-invitation')
    async verifyInvitation(@Body() body: { token: string }) {
        return this.authService.verifyInvitation(body.token);
    }

    @Post('complete-registration')
    async completeRegistration(@Body() body: { token: string; password: string }) {
        return this.authService.completeRegistration(body.token, body.password);
    }

    @Post('forgot-password')
    async forgotPassword(@Body() body: { email: string }) {
        return this.authService.forgotPassword(body.email);
    }

    @Post('reset-password')
    async resetPassword(@Body() body: { token: string; password: string }) {
        return this.authService.resetPassword(body.token, body.password);
    }
}
