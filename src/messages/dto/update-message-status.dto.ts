import { IsEnum, IsNotEmpty } from 'class-validator';
import { MessageStatus } from '@prisma/client';

export class UpdateMessageStatusDto {
    @IsNotEmpty()
    @IsEnum(MessageStatus)
    status: MessageStatus;
}
