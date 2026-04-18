import { PartialType } from '@nestjs/swagger';
import { CreateCollectiveDto } from './create-collective.dto';

export class UpdateCollectiveDto extends PartialType(CreateCollectiveDto) {}
