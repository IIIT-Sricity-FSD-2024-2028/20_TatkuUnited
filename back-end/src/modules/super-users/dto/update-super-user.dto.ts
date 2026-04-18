import { PartialType } from '@nestjs/swagger';
import { CreateSuperUserDto } from './create-super-user.dto';

export class UpdateSuperUserDto extends PartialType(CreateSuperUserDto) {}
