import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RegionManagersRepository } from './region-managers.repository';
import { CreateRegionManagerDto } from './dto/create-region-manager.dto';
import { UpdateRegionManagerDto } from './dto/update-region-manager.dto';
import { AccessScopeService } from '../../common/access/access-scope.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class RegionManagersService {
  constructor(
    private readonly repo: RegionManagersRepository,
    private readonly accessScope: AccessScopeService,
  ) {}

  findAll() {
    return this.repo.findAll();
  }

  findOne(id: string) {
    const rm = this.repo.findById(id);
    if (!rm) throw new NotFoundException(`Region manager "${id}" not found`);
    return rm;
  }

  findOneScoped(id: string, user: JwtPayload) {
    const rm = this.findOne(id);
    this.accessScope.assertRegionAccess(user, rm.region_id);
    return rm;
  }

  create(dto: CreateRegionManagerDto) {
    if (this.repo.findByEmail(dto.email)) {
      throw new BadRequestException(`Email "${dto.email}" is already registered`);
    }
    return this.repo.create(dto);
  }

  update(id: string, dto: UpdateRegionManagerDto) {
    const updated = this.repo.update(id, dto);
    if (!updated) throw new NotFoundException(`Region manager "${id}" not found`);
    return updated;
  }

  remove(id: string) {
    const deleted = this.repo.delete(id);
    if (!deleted) throw new NotFoundException(`Region manager "${id}" not found`);
    return { success: true };
  }
}
