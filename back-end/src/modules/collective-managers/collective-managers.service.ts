import { Injectable } from '@nestjs/common';
import { CreateCollectiveManagerDto } from './dto/create-collective-manager.dto';
import { UpdateCollectiveManagerDto } from './dto/update-collective-manager.dto';

@Injectable()
export class CollectiveManagersService {
  create(createCollectiveManagerDto: CreateCollectiveManagerDto) {
    return 'This action adds a new collectiveManager';
  }

  findAll() {
    return `This action returns all collectiveManagers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} collectiveManager`;
  }

  update(id: number, updateCollectiveManagerDto: UpdateCollectiveManagerDto) {
    return `This action updates a #${id} collectiveManager`;
  }

  remove(id: number) {
    return `This action removes a #${id} collectiveManager`;
  }
}
