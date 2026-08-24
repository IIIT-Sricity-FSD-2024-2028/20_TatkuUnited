import { PartialType } from '@nestjs/mapped-types';
import { CreatePlatformSettingDto } from './create-platform-setting.dto';

export class UpdatePlatformSettingDto extends PartialType(CreatePlatformSettingDto) {}
