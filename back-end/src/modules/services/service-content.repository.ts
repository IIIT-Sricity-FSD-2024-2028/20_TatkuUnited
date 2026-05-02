import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService, ServiceContent } from '../../common/database/database.service';

@Injectable()
export class ServiceContentRepository {
  constructor(private readonly db: DatabaseService) {}

  findByService(serviceId: string): ServiceContent | null {
    return (
      this.db.serviceContent.find(
        (row) => row.service_id === serviceId,
      ) || null
    );
  }

  upsert(serviceId: string, data: Partial<Omit<ServiceContent, 'service_id'>>): ServiceContent {
    const existing = this.db.serviceContent.find(
      (row) => row.service_id === serviceId,
    );

    if (existing) {
      // Update in place
      if (data.how_it_works !== undefined) existing.how_it_works = data.how_it_works;
      if (data.what_is_covered !== undefined) existing.what_is_covered = data.what_is_covered;
      if (data.what_is_not_covered !== undefined) existing.what_is_not_covered = data.what_is_not_covered;
      return existing;
    }

    // Insert new
    const record: ServiceContent = {
      service_id: serviceId,
      how_it_works: data.how_it_works || [],
      what_is_covered: data.what_is_covered || [],
      what_is_not_covered: data.what_is_not_covered || [],
    };
    this.db.serviceContent.push(record);
    return record;
  }
}
