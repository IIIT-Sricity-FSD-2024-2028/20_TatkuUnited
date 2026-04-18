import { PartialType } from '@nestjs/swagger';
import { CreateServiceProviderDto } from './create-service-provider.dto';

export class UpdateServiceProviderDto extends PartialType(CreateServiceProviderDto) {}
