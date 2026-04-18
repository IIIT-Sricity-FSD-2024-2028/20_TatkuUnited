import { PartialType } from '@nestjs/swagger';
import { CreateUnitManagerDto } from './create-unit-manager.dto';

export class UpdateUnitManagerDto extends PartialType(CreateUnitManagerDto) {}
