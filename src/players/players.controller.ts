import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UnauthorizedException } from '@nestjs/common';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('players')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlayersController {
    constructor(private readonly playersService: PlayersService) { }

    @Post()
    @Roles('AGENT')
    async create(@Body() createPlayerDto: CreatePlayerDto, @CurrentUser() user: any) {
        const agentId = await this.playersService.getCurrentAgentId(user.id);
        return this.playersService.create(createPlayerDto, agentId);
    }

    @Get()
    @Roles('AGENT')
    findAll(@CurrentUser() user: any) {
        return this.playersService.findAllByAgent(user.id);
    }

    @Get(':id')
    @Roles('AGENT')
    findOne(@Param('id') id: string) {
        return this.playersService.findOne(+id);
    }

    @Patch(':id')
    @Roles('AGENT')
    update(@Param('id') id: string, @Body() updatePlayerDto: UpdatePlayerDto) {
        return this.playersService.update(+id, updatePlayerDto);
    }

    @Delete(':id')
    @Roles('AGENT')
    remove(@Param('id') id: string) {
        return this.playersService.remove(+id);
    }

    @Patch(':id/notes')
    @Roles('AGENT')
    updateNotes(@Param('id') id: string, @Body('notes') notes: string) {
        return this.playersService.updateNotes(+id, notes);
    }
}
