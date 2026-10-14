import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from '../schema/review.schema';
import { Provider, ProviderDocument } from '../schema/provider.schema';
import { Service, ServiceDocument } from '../schema/service.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Provider.name)
    private readonly providerModel: Model<ProviderDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  async create(dto: CreateReviewDto) {
    const review = await new this.reviewModel(dto).save();

    // Update Provider rating running average (§4.13)
    if (dto.provider && dto.rating) {
      const provider = await this.providerModel.findById(dto.provider).exec();
      if (provider) {
        const count = provider.ratingCount || 0;
        const currentRating = provider.rating || 0;
        const newRating = (currentRating * count + dto.rating) / (count + 1);
        await this.providerModel
          .findByIdAndUpdate(dto.provider, {
            rating: Number(newRating.toFixed(2)),
            ratingCount: count + 1,
          })
          .exec();
      }
    }

    // Update Service rating running average (§4.13)
    if (dto.service && dto.rating) {
      const service = await this.serviceModel.findById(dto.service).exec();
      if (service) {
        const count = service.reviewCount || 0;
        const currentRating = service.rating || 0;
        const newRating = (currentRating * count + dto.rating) / (count + 1);
        await this.serviceModel
          .findByIdAndUpdate(dto.service, {
            rating: Number(newRating.toFixed(2)),
            reviewCount: count + 1,
          })
          .exec();
      }
    }

    return review;
  }

  findAll() {
    return this.reviewModel.find().exec();
  }

  findByService(serviceId: string) {
    const service = Types.ObjectId.isValid(serviceId)
      ? new Types.ObjectId(serviceId)
      : serviceId;
    return this.reviewModel
      .find({ service })
      .sort({ createdAt: -1 })
      .populate('booking', 'scheduledDate')
      .exec();
  }

  findByProvider(providerId: string) {
    const provider = Types.ObjectId.isValid(providerId)
      ? new Types.ObjectId(providerId)
      : providerId;
    return this.reviewModel
      .find({ provider })
      .sort({ createdAt: -1 })
      .exec();
  }

  findByBooking(bookingId: string) {
    const booking = Types.ObjectId.isValid(bookingId)
      ? new Types.ObjectId(bookingId)
      : bookingId;
    return this.reviewModel.findOne({ booking }).exec();
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
