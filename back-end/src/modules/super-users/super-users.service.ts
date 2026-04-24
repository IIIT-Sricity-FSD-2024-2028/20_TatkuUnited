import { Injectable } from '@nestjs/common';
import { SuperUsersRepository } from './super-users.repository';
import { CreateSuperUserDto } from './dto/create-super-user.dto';
import { UpdateSuperUserDto } from './dto/update-super-user.dto';

@Injectable()
export class SuperUsersService {
  constructor(private readonly superUsersRepository: SuperUsersRepository) {}

  findAll() {
    return this.superUsersRepository.findAll();
  }

  findOne(id: string) {
    return this.superUsersRepository.findById(id);
  }

  findByEmail(email: string) {
    return this.superUsersRepository.findByEmail(email);
  }

  create(dto: CreateSuperUserDto) {
    return this.superUsersRepository.create(dto);
  }

  update(id: string, dto: UpdateSuperUserDto) {
    return this.superUsersRepository.update(id, dto);
  }

  remove(id: string) {
    return this.superUsersRepository.delete(id);
  }
}
