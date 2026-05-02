import { PartialType } from '@nestjs/swagger';
import { CreateServiceFaqDto } from './create-service-faq.dto';

export class UpdateServiceFaqDto extends PartialType(CreateServiceFaqDto) {}
