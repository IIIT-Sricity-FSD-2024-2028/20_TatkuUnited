import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { ServicesRepository } from './services.repository';
import { ServiceSkillsRepository } from './service-skills.repository';
import { ServiceContentRepository } from './service-content.repository';
import { ServiceFaqsRepository } from './service-faqs.repository';

@Module({
  controllers: [ServicesController],
  providers: [
    ServicesService,
    ServicesRepository,
    ServiceSkillsRepository,
    ServiceContentRepository,
    ServiceFaqsRepository,
  ],
  exports: [ServicesService],
})
export class ServicesModule {}
