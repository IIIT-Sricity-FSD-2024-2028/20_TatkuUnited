import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService, Customer } from '../../common/database/database.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { randomUUID } from 'crypto';

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
      (row) => row.email.toLowerCase() === email.toLowerCase(),
    );
  }

  create(dto: CreateCustomerDto): Customer {
    const customer: Customer = {
      customer_id: randomUUID(),
      full_name: dto.name,
      email: dto.email,
      password_hash: this.databaseService.storePassword(dto.password),
      phone: dto.phone,
      dob: '',
      address: '',
      city: dto.city || 'Chennai',
      rating: 0,
      is_active: dto.is_active ?? true,
    };
    
    this.databaseService.customers.push(customer);
    this.databaseService.save();
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
    if (dto.address !== undefined) customer.address = dto.address;
    if (dto.city !== undefined) customer.city = dto.city;
    
    this.databaseService.save();
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
    this.databaseService.save();
    return removed;
  }
}
