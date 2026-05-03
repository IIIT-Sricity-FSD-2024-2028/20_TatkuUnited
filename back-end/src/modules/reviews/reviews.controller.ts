import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiRoleHeader } from '../../common/decorators/api-role-header.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@ApiBearerAuth('bearer')
@ApiRoleHeader()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Create a review for a completed booking service' })
  @ApiResponse({ status: 201, description: 'Review created' })
  @ApiResponse({ status: 400, description: 'Booking not completed, duplicate review, or invalid service/provider' })
  @ApiResponse({ status: 403, description: 'Forbidden - customer only or not own booking' })
  create(
    @Body() createReviewDto: CreateReviewDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.reviewsService.create(createReviewDto, req.user.sub);
  }

  @Get()
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER)
  @ApiOperation({ summary: 'List all reviews for operational dashboards' })
  @ApiResponse({ status: 200, description: 'Reviews returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get('booking/:bookingId')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER, Role.SERVICE_PROVIDER, Role.CUSTOMER)
  @ApiOperation({ summary: 'List reviews for a booking' })
  @ApiResponse({ status: 200, description: 'Booking reviews returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByBooking(
    @Param('bookingId') bookingId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.reviewsService.findByBooking(bookingId, req.user);
  }

  @Get('provider/:spId')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER, Role.SERVICE_PROVIDER, Role.CUSTOMER)
  @ApiOperation({ summary: 'List reviews for a service provider' })
  @ApiResponse({ status: 200, description: 'Provider reviews returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByProvider(
    @Param('spId') spId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.reviewsService.findByProvider(spId, req.user);
  }

  @Get('customer/:customerId')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER, Role.CUSTOMER)
  @ApiOperation({ summary: 'List reviews written by a customer' })
  @ApiResponse({ status: 200, description: 'Customer reviews returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByCustomer(
    @Param('customerId') customerId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.reviewsService.findByCustomer(customerId, req.user);
  }

  @Get('service/:serviceId')
  @Public()
  @ApiOperation({ summary: 'List reviews for a service' })
  @ApiResponse({ status: 200, description: 'Service reviews returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByService(@Param('serviceId') serviceId: string) {
    return this.reviewsService.findByService(serviceId);
  }

  @Get(':id')
  @Roles(Role.SUPER_USER, Role.COLLECTIVE_MANAGER, Role.UNIT_MANAGER, Role.SERVICE_PROVIDER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiResponse({ status: 200, description: 'Review returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    return this.reviewsService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(Role.SUPER_USER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Update a review' })
  @ApiResponse({ status: 200, description: 'Review updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.reviewsService.update(id, updateReviewDto, req.user);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Delete a review' })
  @ApiResponse({ status: 200, description: 'Review deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  remove(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    return this.reviewsService.remove(id, req.user);
  }
}
