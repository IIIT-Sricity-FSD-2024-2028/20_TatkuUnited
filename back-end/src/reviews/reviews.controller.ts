import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({
    summary: 'Submit a service review and rating',
    description:
      'Creates a 1-5 star review and optional comment for a completed booking, linking the provider and service.',
  })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 201, description: 'Review submitted successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid review payload or duplicate booking review.' })
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all reviews',
    description: 'Retrieves all reviews with populated booking, provider, and service details.',
  })
  @ApiResponse({ status: 200, description: 'List of all reviews.' })
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get review by ID',
    description: 'Retrieves a single review by its Mongo ObjectId.',
  })
  @ApiParam({ name: 'id', description: 'Review Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Review found.' })
  @ApiResponse({ status: 404, description: 'Review not found.' })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update review',
    description: 'Updates review rating or text comment.',
  })
  @ApiParam({ name: 'id', description: 'Review Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ type: UpdateReviewDto })
  @ApiResponse({ status: 200, description: 'Review updated successfully.' })
  @ApiResponse({ status: 404, description: 'Review not found.' })
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewsService.update(id, updateReviewDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete review',
    description: 'Removes a customer review from the system.',
  })
  @ApiParam({ name: 'id', description: 'Review Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Review successfully removed.' })
  @ApiResponse({ status: 404, description: 'Review not found.' })
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}

