import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { CreateRevenueLedgerDto } from './dto/create-revenue-ledger.dto';
import { UpdateRevenueLedgerDto } from './dto/update-revenue-ledger.dto';

@Injectable()
export class RevenueLedgerService {
  constructor(private readonly db: DatabaseService) {}

  create(createRevenueLedgerDto: CreateRevenueLedgerDto) {
    return 'This action adds a new revenueLedger';
  }

  findAll() {
    return this.db.revenueLedger;
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
