import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CollectiveManagersService } from './collective-managers.service';
import { CreateCollectiveManagerDto } from './dto/create-collective-manager.dto';
import { UpdateCollectiveManagerDto } from './dto/update-collective-manager.dto';

@Controller('collective-managers')
export class CollectiveManagersController {
  constructor(private readonly collectiveManagersService: CollectiveManagersService) {}

  @Post()
  create(@Body() createCollectiveManagerDto: CreateCollectiveManagerDto) {
    return this.collectiveManagersService.create(createCollectiveManagerDto);
  }

  @Get()
  findAll() {
    return this.collectiveManagersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.collectiveManagersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCollectiveManagerDto: UpdateCollectiveManagerDto) {
    return this.collectiveManagersService.update(+id, updateCollectiveManagerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.collectiveManagersService.remove(+id);
  }
}
