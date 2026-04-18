import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RevenueLedgerService } from './revenue-ledger.service';
import { CreateRevenueLedgerDto } from './dto/create-revenue-ledger.dto';
import { UpdateRevenueLedgerDto } from './dto/update-revenue-ledger.dto';

@Controller('revenue-ledger')
export class RevenueLedgerController {
  constructor(private readonly revenueLedgerService: RevenueLedgerService) {}

  @Post()
  create(@Body() createRevenueLedgerDto: CreateRevenueLedgerDto) {
    return this.revenueLedgerService.create(createRevenueLedgerDto);
  }

  @Get()
  findAll() {
    return this.revenueLedgerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.revenueLedgerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRevenueLedgerDto: UpdateRevenueLedgerDto) {
    return this.revenueLedgerService.update(+id, updateRevenueLedgerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.revenueLedgerService.remove(+id);
  }
}
