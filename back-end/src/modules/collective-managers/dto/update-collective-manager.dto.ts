import { PartialType } from '@nestjs/swagger';
import { CreateCollectiveManagerDto } from './create-collective-manager.dto';

export class UpdateCollectiveManagerDto extends PartialType(CreateCollectiveManagerDto) {}
