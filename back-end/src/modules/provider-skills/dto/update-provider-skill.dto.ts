import { PartialType } from '@nestjs/swagger';
import { CreateProviderSkillDto } from './create-provider-skill.dto';

export class UpdateProviderSkillDto extends PartialType(CreateProviderSkillDto) {}
