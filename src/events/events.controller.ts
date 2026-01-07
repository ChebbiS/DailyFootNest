import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Post()
    create(@CurrentUser() user: any, @Body() createEventDto: CreateEventDto) {
        return this.eventsService.create(createEventDto, user.id, user.role as Role);
    }

    @Get()
    findAll(@CurrentUser() user: any) {
        return this.eventsService.findAll(user.id, user.role as Role);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.eventsService.findOne(+id, user.id, user.role as Role);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto, @CurrentUser() user: any) {
        return this.eventsService.update(+id, updateEventDto, user.id, user.role as Role);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.eventsService.remove(+id, user.id, user.role as Role);
    }
}
