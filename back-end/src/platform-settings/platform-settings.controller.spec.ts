import { Test, TestingModule } from '@nestjs/testing';
import { PlatformSettingsController } from './platform-settings.controller';
import { PlatformSettingsService } from './platform-settings.service';

describe('PlatformSettingsController', () => {
  let controller: PlatformSettingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlatformSettingsController],
      providers: [PlatformSettingsService],
    }).compile();

    controller = module.get<PlatformSettingsController>(PlatformSettingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
