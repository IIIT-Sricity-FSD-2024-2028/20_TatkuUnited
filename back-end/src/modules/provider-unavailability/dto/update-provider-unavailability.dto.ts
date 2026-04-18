import { PartialType } from '@nestjs/swagger';
import { CreateProviderUnavailabilityDto } from './create-provider-unavailability.dto';

export class UpdateProviderUnavailabilityDto extends PartialType(CreateProviderUnavailabilityDto) {}
