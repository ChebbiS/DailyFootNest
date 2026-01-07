import { Controller, Body, Patch, UseGuards, Request, Post, UseInterceptors, UploadedFile, Get, Query, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Patch('profile')
    updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
        return this.usersService.updateProfile(req.user.id, dto);
    }

    @Patch('password')
    changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
        return this.usersService.changePassword(req.user.id, dto);
    }

    @Post('avatar')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
        return this.usersService.updateAvatar(req.user.id, `/uploads/${file.filename}`);
    }

    // Admin Endpoints
    @Get()
    getUsers(
        @Query('page') page: string,
        @Query('limit') limit: string,
        @Query('search') search: string
    ) {
        return this.usersService.findAll(+page || 1, +limit || 10, search);
    }

    @Patch(':id/ban')
    banUser(@Param('id') id: string, @Body() body: { isActive: boolean }) {
        return this.usersService.updateUserStatus(+id, body.isActive);
    }

    @Patch(':id/admin')
    updateUserAdmin(@Param('id') id: string, @Body() body: any) {
        return this.usersService.updateUserAdmin(+id, body);
    }
    @Post(':id/avatar')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    uploadUserAvatar(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
        return this.usersService.updateAvatar(+id, `/uploads/${file.filename}`);
    }
}
