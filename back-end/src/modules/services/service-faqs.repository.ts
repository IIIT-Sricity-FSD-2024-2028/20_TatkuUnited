import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService, ServiceFaq } from '../../common/database/database.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ServiceFaqsRepository {
  constructor(private readonly db: DatabaseService) {}

  findByService(serviceId: string): ServiceFaq[] {
    return this.db.serviceFaqs
      .filter((row) => row.service_id === serviceId)
      .sort((a, b) => a.display_order - b.display_order);
  }

  findById(faqId: string): ServiceFaq {
    const faq = this.db.serviceFaqs.find(
      (row) => row.faq_id === faqId,
    );
    if (!faq) {
      throw new NotFoundException(`FAQ with id "${faqId}" not found`);
    }
    return faq;
  }

  create(serviceId: string, data: { question: string; answer: string; display_order?: number }): ServiceFaq {
    const maxOrder = this.findByService(serviceId).reduce(
      (max, f) => Math.max(max, f.display_order),
      0,
    );

    const faq: ServiceFaq = {
      faq_id: randomUUID(),
      question: data.question,
      answer: data.answer,
      display_order: data.display_order ?? maxOrder + 1,
      service_id: serviceId,
    };
    this.db.serviceFaqs.push(faq);
    return faq;
  }

  update(faqId: string, data: Partial<Omit<ServiceFaq, 'faq_id' | 'service_id'>>): ServiceFaq {
    const faq = this.findById(faqId);

    if (data.question !== undefined) faq.question = data.question;
    if (data.answer !== undefined) faq.answer = data.answer;
    if (data.display_order !== undefined) faq.display_order = data.display_order;

    return faq;
  }

  delete(faqId: string): ServiceFaq {
    const index = this.db.serviceFaqs.findIndex(
      (row) => row.faq_id === faqId,
    );
    if (index < 0) {
      throw new NotFoundException(`FAQ with id "${faqId}" not found`);
    }
    const [removed] = this.db.serviceFaqs.splice(index, 1);
    return removed;
  }
}
