import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Customer,
  DatabaseService,
  ServiceProvider,
} from '../database/database.service';
import { Role } from '../enums/role.enum';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

@Injectable()
export class AccessScopeService {
  constructor(private readonly db: DatabaseService) {}

  getProvider(providerId: string): ServiceProvider {
    const provider = this.db.serviceProviders.find((row) => row.sp_id === providerId);
    if (!provider) {
      throw new NotFoundException(`Service provider "${providerId}" not found`);
    }
    return provider;
  }

  getCustomer(customerId: string): Customer {
    const customer = this.db.customers.find((row) => row.customer_id === customerId);
    if (!customer) {
      throw new NotFoundException(`Customer "${customerId}" not found`);
    }
    return customer;
  }

  assertProviderAccess(user: JwtPayload, providerId: string): void {
    if (user.role === Role.SUPER_USER) return;
    const provider = this.getProvider(providerId);
    if (user.role === Role.SERVICE_PROVIDER) {
      if (provider.sp_id !== user.sub) {
        throw new ForbiddenException('Providers can only access their own records');
      }
      return;
    }
    throw new ForbiddenException('Access denied');
  }

  assertCustomerAccess(user: JwtPayload, customerId: string): void {
    if (user.role === Role.SUPER_USER) return;
    const customer = this.getCustomer(customerId);
    if (user.role === Role.CUSTOMER) {
      if (customer.customer_id !== user.sub) {
        throw new ForbiddenException('Customers can only access their own records');
      }
      return;
    }
    throw new ForbiddenException('Access denied');
  }
}
