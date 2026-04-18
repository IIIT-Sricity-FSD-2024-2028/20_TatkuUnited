import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { JobAssignmentsService } from './job-assignments.service';
import { CreateJobAssignmentDto } from './dto/create-job-assignment.dto';
import { UpdateJobAssignmentDto } from './dto/update-job-assignment.dto';

@Controller('job-assignments')
export class JobAssignmentsController {
  constructor(private readonly jobAssignmentsService: JobAssignmentsService) {}

  @Post()
  create(@Body() createJobAssignmentDto: CreateJobAssignmentDto) {
    return this.jobAssignmentsService.create(createJobAssignmentDto);
  }

  @Get()
  findAll() {
    return this.jobAssignmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobAssignmentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateJobAssignmentDto: UpdateJobAssignmentDto) {
    return this.jobAssignmentsService.update(+id, updateJobAssignmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobAssignmentsService.remove(+id);
  }
}
