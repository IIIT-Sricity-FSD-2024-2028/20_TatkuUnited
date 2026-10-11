import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new service category',
    description: 'Creates a service category with name, description, image URL, and active status.',
  })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ status: 201, description: 'Category successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid category payload.' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all categories',
    description: 'Retrieves all service categories in the platform catalog.',
  })
  @ApiResponse({ status: 200, description: 'List of all categories.' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get category by ID',
    description: 'Retrieves a single service category by Mongo ObjectId.',
  })
  @ApiParam({ name: 'id', description: 'Category Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Category found.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update category',
    description: 'Updates category title, description, thumbnail image, or active status.',
  })
  @ApiParam({ name: 'id', description: 'Category Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({ status: 200, description: 'Category updated successfully.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete category',
    description: 'Removes a category from the catalog.',
  })
  @ApiParam({ name: 'id', description: 'Category Mongo ObjectId', example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiResponse({ status: 200, description: 'Category successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}

