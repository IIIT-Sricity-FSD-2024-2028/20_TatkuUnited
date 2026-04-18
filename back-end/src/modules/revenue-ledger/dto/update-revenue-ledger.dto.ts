import { PartialType } from '@nestjs/swagger';
import { CreateRevenueLedgerDto } from './create-revenue-ledger.dto';

export class UpdateRevenueLedgerDto extends PartialType(CreateRevenueLedgerDto) {}
