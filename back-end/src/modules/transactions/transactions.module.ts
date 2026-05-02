import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TransactionsRepository } from './transactions.repository';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsRepository, TransactionsService],
  exports: [TransactionsService],
  // No imports array — DatabaseService is global
})
export class TransactionsModule {}
