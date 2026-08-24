import { Test, TestingModule } from '@nestjs/testing';
import { PlatformSettingsService } from './platform-settings.service';

describe('PlatformSettingsService', () => {
  let service: PlatformSettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlatformSettingsService],
    }).compile();

    service = module.get<PlatformSettingsService>(PlatformSettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
