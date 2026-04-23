import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service-provider.dto';
import { DatabaseService } from '../../common/database/database.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class ServiceProvidersService {
  constructor(private readonly databaseService: DatabaseService) {}

  create(createServiceProviderDto: CreateServiceProviderDto) {
    return createServiceProviderDto;
  }

  findAll() {
    return this.databaseService.serviceProviders;
  }

  findOne(id: string) {
    const provider = this.databaseService.serviceProviders.find(
      (row) => row.sp_id === id,
    );
    if (!provider) {
      throw new NotFoundException('Service provider not found');
    }
    return provider;
  }

  update(id: string, updateServiceProviderDto: UpdateServiceProviderDto) {
    const provider = this.databaseService.serviceProviders.find(
      (row) => row.sp_id === id,
    );

    if (!provider) {
      throw new NotFoundException('Service provider not found');
    }

    Object.assign(provider, updateServiceProviderDto, {
      updated_at: this.databaseService.now(),
    });

    return provider;
  }

  approve(id: string, unitId: string, approver: JwtPayload) {
    if (approver.role !== Role.COLLECTIVE_MANAGER) {
      throw new ForbiddenException('Only collective managers can approve providers');
    }

    const collectiveManager = this.databaseService.collectiveManagers.find(
      (row) => row.cm_id === approver.sub,
    );
    if (!collectiveManager) {
      throw new ForbiddenException('Collective manager account not found');
    }

    const unit = this.databaseService.units.find((row) => row.unit_id === unitId);
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }
    if (unit.collective_id !== collectiveManager.collective_id) {
      throw new ForbiddenException(
        'You can only approve providers into units under your collective',
      );
    }

    const provider = this.databaseService.serviceProviders.find(
      (row) => row.sp_id === id,
    );
    if (!provider) {
      throw new NotFoundException('Service provider not found');
    }

    provider.unit_id = unitId;
    provider.is_active = true;
    provider.account_status = 'active';
    provider.updated_at = this.databaseService.now();

    return {
      message: 'Provider approved successfully',
      provider,
    };
  }

  remove(id: string) {
    const index = this.databaseService.serviceProviders.findIndex(
      (row) => row.sp_id === id,
    );
    if (index < 0) {
      throw new NotFoundException('Service provider not found');
    }

    const [removed] = this.databaseService.serviceProviders.splice(index, 1);
    return removed;
  }
}
