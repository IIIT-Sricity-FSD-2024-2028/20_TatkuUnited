import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService, SuperUser } from '../../common/database/database.service';
import { CreateSuperUserDto } from './dto/create-super-user.dto';
import { UpdateSuperUserDto } from './dto/update-super-user.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class SuperUsersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  findAll(): SuperUser[] {
    return this.databaseService.superUsers;
  }

  findById(id: string): SuperUser {
    const superUser = this.databaseService.superUsers.find(
      (row) => row.super_user_id === id,
    );
    if (!superUser) {
      throw new NotFoundException(`SuperUser with id "${id}" not found`);
    }
    return superUser;
  }

  findByEmail(email: string): SuperUser | undefined {
    return this.databaseService.superUsers.find(
      (row) => row.email === email,
    );
  }

  create(dto: CreateSuperUserDto): SuperUser {
    const superUser: SuperUser = {
      super_user_id: uuid(),
      name: dto.name,
      email: dto.email,
      password_hash: this.databaseService.storePassword(dto.password),
      phone: dto.phone || '',
      is_active: dto.is_active,
      last_login: '',
      created_at: new Date().toISOString(),
    };
    this.databaseService.superUsers.push(superUser);
    return superUser;
  }

  update(id: string, dto: UpdateSuperUserDto): SuperUser {
    const superUser = this.findById(id);
    
    const { password, ...rest } = dto;
    Object.assign(superUser, rest);
    
    if (password) {
      superUser.password_hash = this.databaseService.storePassword(password);
    }
    
    return superUser;
  }

  delete(id: string): SuperUser {
    const index = this.databaseService.superUsers.findIndex(
      (row) => row.super_user_id === id,
    );
    if (index < 0) {
      throw new NotFoundException(`SuperUser with id "${id}" not found`);
    }
    const [removed] = this.databaseService.superUsers.splice(index, 1);
    return removed;
  }
}
