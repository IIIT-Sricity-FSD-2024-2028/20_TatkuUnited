import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from '../schema/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
  ) {}

  create(dto: CreateReviewDto) {
    return new this.reviewModel(dto).save();
  }

  findAll() {
    return this.reviewModel.find().exec();
  }

  findByService(serviceId: string) {
    return this.reviewModel
      .find({ service: serviceId })
      .sort({ createdAt: -1 })
      .populate('booking', 'scheduledDate')
      .exec();
  }

  findByProvider(providerId: string) {
    return this.reviewModel
      .find({ provider: providerId })
      .sort({ createdAt: -1 })
      .exec();
  }

  findByBooking(bookingId: string) {
    return this.reviewModel.findOne({ booking: bookingId }).exec();
  }

  async findOne(id: string) {
    const doc = await this.reviewModel.findById(id).exec();
    if (!doc) throw new NotFoundException(`Review ${id} not found`);
    return doc;
  }

  async update(id: string, dto: UpdateReviewDto) {
    const doc = await this.reviewModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!doc) throw new NotFoundException(`Review ${id} not found`);
    return doc;
  }

  async remove(id: string) {
    const doc = await this.reviewModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException(`Review ${id} not found`);
    return doc;
  }
}
