import { Injectable } from '@nestjs/common';
import { CreateRevenueLedgerDto } from './dto/create-revenue-ledger.dto';
import { UpdateRevenueLedgerDto } from './dto/update-revenue-ledger.dto';

@Injectable()
export class RevenueLedgerService {
  create(createRevenueLedgerDto: CreateRevenueLedgerDto) {
    return 'This action adds a new revenueLedger';
  }

  findAll() {
    return `This action returns all revenueLedger`;
  }

  findOne(id: number) {
    return `This action returns a #${id} revenueLedger`;
  }

  update(id: number, updateRevenueLedgerDto: UpdateRevenueLedgerDto) {
    return `This action updates a #${id} revenueLedger`;
  }

  remove(id: number) {
    return `This action removes a #${id} revenueLedger`;
  }
}
