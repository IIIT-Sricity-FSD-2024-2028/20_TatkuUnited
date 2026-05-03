import { Injectable } from '@nestjs/common';
import { DatabaseService } from './common/database/database.service';

@Injectable()
export class AppService {
  constructor(private readonly db: DatabaseService) {}

  getHello(): string {
    return 'Hello World!';
  }

  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
  }

  getLandingData() {
    return {
      bookings: this.db.bookings,
      customers: this.db.customers,
      service_providers: this.db.serviceProviders,
      categories: this.db.categories,
      job_assignments: this.db.jobAssignments,
      booking_services: this.db.bookingServices,
      services: this.db.services,
      platform_settings: this.db.platformSettings
    };
  }
}
