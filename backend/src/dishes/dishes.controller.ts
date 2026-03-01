import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DishesService } from './dishes.service';

@Controller('dishes')
export class DishesController {
  constructor(private readonly dishesService: DishesService) {}

  @Get()
  findAll() {
    return this.dishesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dishesService.findOne(+id);
  }

  @Get('category/:categoryId')
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.dishesService.findByCategory(+categoryId);
  }

  @Get('station/:stationId')
  findByStation(@Param('stationId') stationId: string) {
    return this.dishesService.findByStation(+stationId);
  }

  @Get('search')
  searchByName(@Query('name') name: string) {
    return this.dishesService.searchByName(name);
  }

  @Get('prep/:needPrep')
  findByPrepRequirement(@Param('needPrep') needPrep: string) {
    const needPrepBool = needPrep.toLowerCase() === 'true';
    return this.dishesService.findByPrepRequirement(needPrepBool);
  }

  @Get('categories/serving-order')
  getCategoriesInServingOrder() {
    return this.dishesService.getCategoriesInServingOrder();
  }

  @Get('grouped-by-category')
  getDishesGroupedByCategory() {
    return this.dishesService.getDishesGroupedByCategory();
  }

  @Post()
  create(@Body() createDishDto: any) {
    return this.dishesService.create(createDishDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDishDto: any) {
    return this.dishesService.update(+id, updateDishDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dishesService.remove(+id);
  }

  @Post('batch-prep')
  batchUpdatePrepRequirement(@Body() body: { dishIds: number[]; needPrep: boolean }) {
    const { dishIds, needPrep } = body;
    return this.dishesService.batchUpdatePrepRequirement(dishIds, needPrep);
  }
}