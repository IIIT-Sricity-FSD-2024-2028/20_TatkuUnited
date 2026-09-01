import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Customer,
  DatabaseService,
  Region,
  RegionManager,
  ServiceProvider,
} from '../database/database.service';
import { Role } from '../enums/role.enum';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

@Injectable()
export class AccessScopeService {
  constructor(private readonly db: DatabaseService) {}

  getRegionManager(userId: string): RegionManager {
    const manager = this.db.regionManagers.find((row) => row.rm_id === userId);
    if (!manager) {
      throw new NotFoundException(`Region manager "${userId}" not found`);
    }
    return manager;
  }

  getRegion(regionId: string): Region {
    const region = this.db.regions.find(
      (row) => row.region_id === regionId,
    );
    if (!region) {
      throw new NotFoundException(`Region "${regionId}" not found`);
    }
    return region;
  }

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

  assertRegionAccess(user: JwtPayload, regionId: string): void {
    if (user.role === Role.SUPER_USER) return;
    if (user.role === Role.REGION_MANAGER) {
      const manager = this.getRegionManager(user.sub);
      if (manager.region_id !== regionId) {
        throw new ForbiddenException('Region managers can only access their own region');
      }
      return;
    }
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
    if (user.role === Role.REGION_MANAGER) {
      const manager = this.getRegionManager(user.sub);
      if (provider.region_id && provider.region_id !== manager.region_id) {
        throw new ForbiddenException('Region managers can only access providers in their region');
      }
    }
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
  }
}
