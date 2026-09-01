import { Injectable, NotFoundException } from '@nestjs/common';
import { RegionsRepository } from './regions.repository';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { AccessScopeService } from '../../common/access/access-scope.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class RegionsService {
  constructor(
    private readonly repo: RegionsRepository,
    private readonly accessScope: AccessScopeService,
  ) {}

  findAll() {
    return this.repo.findAll();
  }

  findOne(id: string) {
    const region = this.repo.findById(id);
    if (!region) throw new NotFoundException(`Region "${id}" not found`);
    return region;
  }

  findOneScoped(id: string, user: JwtPayload) {
    this.accessScope.assertRegionAccess(user, id);
    return this.findOne(id);
  }

  create(dto: CreateRegionDto) {
    return this.repo.create(dto);
  }

  update(id: string, dto: UpdateRegionDto) {
    const updated = this.repo.update(id, dto);
    if (!updated) throw new NotFoundException(`Region "${id}" not found`);
    return updated;
  }

  remove(id: string) {
    const deleted = this.repo.delete(id);
    if (!deleted) throw new NotFoundException(`Region "${id}" not found`);
    return { success: true };
  }
}
