import { PartialType } from '@nestjs/swagger';
import { CreateRegionManagerDto } from './create-region-manager.dto';

export class UpdateRegionManagerDto extends PartialType(CreateRegionManagerDto) {}
