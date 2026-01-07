import { Controller, Get, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { UpdateStatisticDto } from './dto/update-statistic.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('statistics')
@UseGuards(JwtAuthGuard)
export class StatisticsController {
    constructor(private readonly statisticsService: StatisticsService) { }

    @Get('player/:playerId')
    findByPlayerId(@Param('playerId') playerId: string, @CurrentUser() user: any) {
        return this.statisticsService.findByPlayerId(+playerId, user.id, user.role as Role);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateStatisticDto: UpdateStatisticDto, @CurrentUser() user: any) {
        return this.statisticsService.update(+id, updateStatisticDto, user.id, user.role as Role);
    }
}
