import { PartialType } from '@nestjs/swagger';
import { CreatePlatformSettingDto } from './create-platform-setting.dto';

export class UpdatePlatformSettingDto extends PartialType(CreatePlatformSettingDto) {}
