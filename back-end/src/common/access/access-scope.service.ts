import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Collective,
  CollectiveManager,
  Customer,
  DatabaseService,
  Sector,
  ServiceProvider,
  Unit,
  UnitManager,
} from '../database/database.service';
import { Role } from '../enums/role.enum';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

@Injectable()
export class AccessScopeService {
  constructor(private readonly db: DatabaseService) {}

  getCollectiveManager(userId: string): CollectiveManager {
    const manager = this.db.collectiveManagers.find((row) => row.cm_id === userId);
    if (!manager) {
      throw new NotFoundException(`Collective manager "${userId}" not found`);
    }
    return manager;
  }

  getUnitManager(userId: string): UnitManager {
    const manager = this.db.unitManagers.find((row) => row.um_id === userId);
    if (!manager) {
      throw new NotFoundException(`Unit manager "${userId}" not found`);
    }
    return manager;
  }

  getCollective(collectiveId: string): Collective {
    const collective = this.db.collectives.find(
      (row) => row.collective_id === collectiveId,
    );
    if (!collective) {
      throw new NotFoundException(`Collective "${collectiveId}" not found`);
    }
    return collective;
  }

  getUnit(unitId: string): Unit {
    const unit = this.db.units.find((row) => row.unit_id === unitId);
    if (!unit) {
      throw new NotFoundException(`Unit "${unitId}" not found`);
    }
    return unit;
  }

  getSector(sectorId: string): Sector {
    const sector = this.db.sectors.find((row) => row.sector_id === sectorId);
    if (!sector) {
      throw new NotFoundException(`Sector "${sectorId}" not found`);
    }
    return sector;
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

  assertCollectiveAccess(user: JwtPayload, collectiveId: string): void {
    if (user.role === Role.SUPER_USER) return;
    if (user.role === Role.COLLECTIVE_MANAGER) {
      const manager = this.getCollectiveManager(user.sub);
      if (manager.collective_id !== collectiveId) {
        throw new ForbiddenException('Collective managers can only access their own collective');
      }
      return;
    }
    if (user.role === Role.UNIT_MANAGER) {
      const manager = this.getUnitManager(user.sub);
      const unit = this.getUnit(manager.unit_id);
      if (unit.collective_id !== collectiveId) {
        throw new ForbiddenException('Unit managers can only access resources in their collective');
      }
    }
  }

  assertUnitAccess(user: JwtPayload, unitId: string): void {
    if (user.role === Role.SUPER_USER) return;
    const unit = this.getUnit(unitId);
    if (user.role === Role.COLLECTIVE_MANAGER) {
      const manager = this.getCollectiveManager(user.sub);
      if (unit.collective_id !== manager.collective_id) {
        throw new ForbiddenException('Collective managers can only access units in their collective');
      }
      return;
    }
    if (user.role === Role.UNIT_MANAGER) {
      const manager = this.getUnitManager(user.sub);
      if (manager.unit_id !== unitId) {
        throw new ForbiddenException('Unit managers can only access their own unit');
      }
    }
  }

  assertSectorAccess(user: JwtPayload, sectorId: string): void {
    if (user.role === Role.SUPER_USER) return;
    const sector = this.getSector(sectorId);
    this.assertCollectiveAccess(user, sector.collective_id);
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
    if (user.role === Role.COLLECTIVE_MANAGER || user.role === Role.UNIT_MANAGER) {
      if (!provider.unit_id) {
        if (!provider.home_sector_id) {
          throw new ForbiddenException('Provider has no unit or sector assigned');
        }
        this.assertSectorAccess(user, provider.home_sector_id);
      } else {
        this.assertUnitAccess(user, provider.unit_id);
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
    if (user.role === Role.COLLECTIVE_MANAGER || user.role === Role.UNIT_MANAGER) {
      this.assertSectorAccess(user, customer.home_sector_id);
    }
  }

  assertUnitAndSectorCompatible(unitId: string, sectorId: string): void {
    const unit = this.getUnit(unitId);
    const sector = this.getSector(sectorId);
    if (unit.collective_id !== sector.collective_id) {
      throw new ForbiddenException(
        'Unit and sector must belong to the same collective',
      );
    }
  }
}
