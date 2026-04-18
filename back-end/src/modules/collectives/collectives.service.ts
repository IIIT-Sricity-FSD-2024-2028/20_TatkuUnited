import { Injectable } from '@nestjs/common';
import { CreateCollectiveDto } from './dto/create-collective.dto';
import { UpdateCollectiveDto } from './dto/update-collective.dto';

@Injectable()
export class CollectivesService {
  create(createCollectiveDto: CreateCollectiveDto) {
    return 'This action adds a new collective';
  }

  findAll() {
    return `This action returns all collectives`;
  }

  findOne(id: number) {
    return `This action returns a #${id} collective`;
  }

  update(id: number, updateCollectiveDto: UpdateCollectiveDto) {
    return `This action updates a #${id} collective`;
  }

  remove(id: number) {
    return `This action removes a #${id} collective`;
  }
}
