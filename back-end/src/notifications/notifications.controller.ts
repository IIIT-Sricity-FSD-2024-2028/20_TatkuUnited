import {
  Controller,
  Get,
  Patch,
  Param,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@ApiTags('Notifications')
@ApiBearerAuth('bearer-token')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get notifications for current user',
    description: 'Retrieves current user notifications with unread count for polling NotificationBell.',
  })
  @ApiResponse({ status: 200, description: 'List of notifications with unreadCount.' })
  getMyNotifications(@Req() req: any) {
    const user = req.user as AuthenticatedUser;
    return this.notificationsService.findByUser(user.userId);
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Sets readAt to now for a specific notification belonging to current user.',
  })
  @ApiParam({ name: 'id', description: 'Notification Mongo ObjectId' })
  @ApiResponse({ status: 200, description: 'Notification updated.' })
  markAsRead(@Param('id') id: string, @Req() req: any) {
    const user = req.user as AuthenticatedUser;
    return this.notificationsService.markAsRead(id, user.userId);
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Sets readAt for all unread notifications of the current user.',
  })
  @ApiResponse({ status: 200, description: 'All notifications marked as read.' })
  markAllAsRead(@Req() req: any) {
    const user = req.user as AuthenticatedUser;
    return this.notificationsService.markAllAsRead(user.userId);
  }
}
