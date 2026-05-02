import { Injectable } from '@nestjs/common';
import { ServicesRepository } from './services.repository';
import { ServiceSkillsRepository } from './service-skills.repository';
import { ServiceContentRepository } from './service-content.repository';
import { ServiceFaqsRepository } from './service-faqs.repository';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UpsertServiceContentDto } from './dto/upsert-service-content.dto';
import { CreateServiceFaqDto } from './dto/create-service-faq.dto';
import { UpdateServiceFaqDto } from './dto/update-service-faq.dto';

@Injectable()
export class ServicesService {
  constructor(
    private readonly servicesRepository: ServicesRepository,
    private readonly serviceSkillsRepository: ServiceSkillsRepository,
    private readonly serviceContentRepository: ServiceContentRepository,
    private readonly serviceFaqsRepository: ServiceFaqsRepository,
  ) {}

  // ── Core CRUD ──────────────────────────────────────────

  findAll() {
    return this.servicesRepository.findAll();
  }

  findOne(id: string) {
    return this.servicesRepository.findById(id);
  }

  findByCategory(categoryId: string) {
    return this.servicesRepository.findByCategory(categoryId);
  }

  findAvailable() {
    return this.servicesRepository.findAvailable();
  }

  create(dto: CreateServiceDto) {
    return this.servicesRepository.create(dto);
  }

  update(id: string, dto: UpdateServiceDto) {
    return this.servicesRepository.update(id, dto);
  }

  remove(id: string) {
    return this.servicesRepository.delete(id);
  }

  // ── ServiceSkills (junction) ───────────────────────────

  getServiceSkills(serviceId: string) {
    // Validate service exists first
    this.servicesRepository.findById(serviceId);
    return this.serviceSkillsRepository.findByService(serviceId);
  }

  linkSkill(serviceId: string, skillId: string) {
    // Validate service exists first
    this.servicesRepository.findById(serviceId);
    return this.serviceSkillsRepository.link(serviceId, skillId);
  }

  unlinkSkill(serviceId: string, skillId: string) {
    return this.serviceSkillsRepository.unlink(serviceId, skillId);
  }

  // ── ServiceContent (1:1) ───────────────────────────────

  getContent(serviceId: string) {
    // Validate service exists first
    this.servicesRepository.findById(serviceId);
    return this.serviceContentRepository.findByService(serviceId);
  }

  upsertContent(serviceId: string, dto: UpsertServiceContentDto) {
    // Validate service exists first
    this.servicesRepository.findById(serviceId);
    return this.serviceContentRepository.upsert(serviceId, dto);
  }

  // ── ServiceFAQs ────────────────────────────────────────

  getFaqs(serviceId: string) {
    // Validate service exists first
    this.servicesRepository.findById(serviceId);
    return this.serviceFaqsRepository.findByService(serviceId);
  }

  createFaq(serviceId: string, dto: CreateServiceFaqDto) {
    // Validate service exists first
    this.servicesRepository.findById(serviceId);
    return this.serviceFaqsRepository.create(serviceId, dto);
  }

  updateFaq(faqId: string, dto: UpdateServiceFaqDto) {
    return this.serviceFaqsRepository.update(faqId, dto);
  }

  deleteFaq(faqId: string) {
    return this.serviceFaqsRepository.delete(faqId);
  }
}
