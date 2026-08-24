import { PartialType } from '@nestjs/mapped-types';
import { CreateUnavailabilityDto } from './create-unavailability.dto';

export class UpdateUnavailabilityDto extends PartialType(CreateUnavailabilityDto) {}
