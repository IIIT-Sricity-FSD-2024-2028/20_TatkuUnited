import { Injectable } from '@nestjs/common';
import { CreateSuperUserDto } from './dto/create-super-user.dto';
import { UpdateSuperUserDto } from './dto/update-super-user.dto';

@Injectable()
export class SuperUsersService {
  create(createSuperUserDto: CreateSuperUserDto) {
    return 'This action adds a new superUser';
  }

  findAll() {
    return `This action returns all superUsers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} superUser`;
  }

  update(id: number, updateSuperUserDto: UpdateSuperUserDto) {
    return `This action updates a #${id} superUser`;
  }

  remove(id: number) {
    return `This action removes a #${id} superUser`;
  }
}
