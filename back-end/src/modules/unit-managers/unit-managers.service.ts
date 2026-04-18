import { Injectable } from '@nestjs/common';
import { CreateUnitManagerDto } from './dto/create-unit-manager.dto';
import { UpdateUnitManagerDto } from './dto/update-unit-manager.dto';

@Injectable()
export class UnitManagersService {
  create(createUnitManagerDto: CreateUnitManagerDto) {
    return 'This action adds a new unitManager';
  }

  findAll() {
    return `This action returns all unitManagers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} unitManager`;
  }

  update(id: number, updateUnitManagerDto: UpdateUnitManagerDto) {
    return `This action updates a #${id} unitManager`;
  }

  remove(id: number) {
    return `This action removes a #${id} unitManager`;
  }
}
