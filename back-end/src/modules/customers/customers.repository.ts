import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService, Customer } from '../../common/database/database.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class CustomersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  findAll(): Customer[] {
    return this.databaseService.customers;
  }

  findById(id: string): Customer {
    const customer = this.databaseService.customers.find(
      (row) => row.customer_id === id,
    );
    if (!customer) {
      throw new NotFoundException(`Customer with id "${id}" not found`);
    }
    return customer;
  }

  findByEmail(email: string): Customer | undefined {
    return this.databaseService.customers.find(
      (row) => row.email === email,
    );
  }

  findBySector(sectorId: string): Customer[] {
    return this.databaseService.customers.filter(
      (row) => row.home_sector_id === sectorId,
    );
  }

  create(dto: CreateCustomerDto): Customer {
    const customer = {
      customer_id: uuid(),
      full_name: dto.name,
      email: dto.email,
      password_hash: this.databaseService.storePassword(dto.password),
      phone: dto.phone,
      dob: '',
      address: '',
      rating: 0,
      is_active: dto.is_active,
      home_sector_id: '',
      created_at: new Date().toISOString(),
    } as unknown as Customer;
    
    this.databaseService.customers.push(customer);
    return customer;
  }

  update(id: string, dto: UpdateCustomerDto): Customer {
    const customer = this.findById(id);
    
    if (dto.password) {
      customer.password_hash = this.databaseService.storePassword(dto.password);
    }
    if (dto.name !== undefined) customer.full_name = dto.name;
    if (dto.email !== undefined) customer.email = dto.email;
    if (dto.phone !== undefined) customer.phone = dto.phone;
    if (dto.is_active !== undefined) customer.is_active = dto.is_active;
    
    return customer;
  }

  delete(id: string): Customer {
    const index = this.databaseService.customers.findIndex(
      (row) => row.customer_id === id,
    );
    if (index < 0) {
      throw new NotFoundException(`Customer with id "${id}" not found`);
    }
    const [removed] = this.databaseService.customers.splice(index, 1);
    return removed;
  }
}
