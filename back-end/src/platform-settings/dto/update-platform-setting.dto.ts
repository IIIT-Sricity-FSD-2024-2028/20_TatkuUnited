import { PartialType } from '@nestjs/mapped-types';
import { CreatePlatformSettingDto } from './create-platform-setting.dto';

/** All fields are optional — only changed settings need to be provided. */
export class UpdatePlatformSettingDto extends PartialType(
  CreatePlatformSettingDto,
) {}
