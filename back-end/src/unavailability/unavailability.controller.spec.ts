import { Test, TestingModule } from '@nestjs/testing';
import { UnavailabilityController } from './unavailability.controller';
import { UnavailabilityService } from './unavailability.service';

describe('UnavailabilityController', () => {
  let controller: UnavailabilityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnavailabilityController],
      providers: [UnavailabilityService],
    }).compile();

    controller = module.get<UnavailabilityController>(UnavailabilityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
