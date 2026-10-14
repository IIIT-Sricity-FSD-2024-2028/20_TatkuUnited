import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from '../schema/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(
    userId: string | Types.ObjectId,
    type: string,
    message: string,
    bookingId?: string | Types.ObjectId,
  ): Promise<NotificationDocument> {
    const user = Types.ObjectId.isValid(userId)
      ? new Types.ObjectId(userId)
      : userId;
    const booking = bookingId
      ? Types.ObjectId.isValid(bookingId)
        ? new Types.ObjectId(bookingId)
        : bookingId
      : null;

    return new this.notificationModel({
      user,
      type,
      message,
      booking,
      readAt: null,
    }).save();
  }

  async findByUser(userId: string | Types.ObjectId, limit = 50) {
    const user = Types.ObjectId.isValid(userId)
      ? new Types.ObjectId(userId)
      : userId;

    const [items, unreadCount] = await Promise.all([
      this.notificationModel
        .find({ user })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('booking')
        .exec(),
      this.notificationModel.countDocuments({ user, readAt: null }).exec(),
    ]);

    return { items, unreadCount };
  }

  async markAsRead(id: string, userId: string | Types.ObjectId) {
    const user = Types.ObjectId.isValid(userId)
      ? new Types.ObjectId(userId)
      : userId;
    const notification = await this.notificationModel
      .findOneAndUpdate(
        { _id: id, user },
        { readAt: new Date() },
        { new: true },
      )
      .exec();

    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    return notification;
  }

  async markAllAsRead(userId: string | Types.ObjectId) {
    const user = Types.ObjectId.isValid(userId)
      ? new Types.ObjectId(userId)
      : userId;
    await this.notificationModel
      .updateMany({ user, readAt: null }, { readAt: new Date() })
      .exec();
    return { success: true };
  }
}
