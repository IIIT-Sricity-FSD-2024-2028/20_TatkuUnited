import { Injectable } from '@nestjs/common';
import { CustomersRepository } from './customers.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  findAll() {
    return this.customersRepository.findAll();
  }

  findOne(id: string) {
    return this.customersRepository.findById(id);
  }

  findByEmail(email: string) {
    return this.customersRepository.findByEmail(email);
  }

  create(dto: CreateCustomerDto) {
    return this.customersRepository.create(dto);
  }

  update(id: string, dto: UpdateCustomerDto) {
    return this.customersRepository.update(id, dto);
  }

  remove(id: string) {
    return this.customersRepository.delete(id);
  }
}
