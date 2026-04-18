import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProviderSkillsService } from './provider-skills.service';
import { CreateProviderSkillDto } from './dto/create-provider-skill.dto';
import { UpdateProviderSkillDto } from './dto/update-provider-skill.dto';

@Controller('provider-skills')
export class ProviderSkillsController {
  constructor(private readonly providerSkillsService: ProviderSkillsService) {}

  @Post()
  create(@Body() createProviderSkillDto: CreateProviderSkillDto) {
    return this.providerSkillsService.create(createProviderSkillDto);
  }

  @Get()
  findAll() {
    return this.providerSkillsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.providerSkillsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProviderSkillDto: UpdateProviderSkillDto) {
    return this.providerSkillsService.update(+id, updateProviderSkillDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.providerSkillsService.remove(+id);
  }
}
