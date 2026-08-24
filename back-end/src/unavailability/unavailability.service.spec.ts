import { Test, TestingModule } from '@nestjs/testing';
import { UnavailabilityService } from './unavailability.service';

describe('UnavailabilityService', () => {
  let service: UnavailabilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UnavailabilityService],
    }).compile();

    service = module.get<UnavailabilityService>(UnavailabilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
