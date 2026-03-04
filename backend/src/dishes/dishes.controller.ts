import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DishesService } from './dishes.service';

@Controller('dishes')
export class DishesController {
  constructor(private readonly dishesService: DishesService) {}

  @Get()
  findAll() {
    return this.dishesService.findAll();
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

  // 具体路由必须放在动态参数路由之前
  @Get('stations')
  findAllStations() {
    return this.dishesService.findAllStations();
  }

  @Get('categories')
  findAllCategories() {
    return this.dishesService.findAllCategories();
  }

  @Get('categories/serving-order')
  getCategoriesInServingOrder() {
    return this.dishesService.getCategoriesInServingOrder();
  }

  @Get('grouped-by-category')
  getDishesGroupedByCategory() {
    return this.dishesService.getDishesGroupedByCategory();
  }

  @Get('category/:categoryId')
  findByCategory(@Param('categoryId') categoryId: number) {
    return this.dishesService.findByCategory(categoryId);
  }

  @Get('station/:stationId')
  findByStation(@Param('stationId') stationId: number) {
    return this.dishesService.findByStation(stationId);
  }

  @Post('batch-prep')
  batchUpdatePrepRequirement(
    @Body() body: { dishIds: number[]; needPrep: boolean },
  ) {
    const { dishIds, needPrep } = body;
    return this.dishesService.batchUpdatePrepRequirement(dishIds, needPrep);
  }

  // 动态参数路由必须放在最后
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.dishesService.findOne(id);
  }

  @Post()
  create(@Body() createDishDto: any) {
    return this.dishesService.create(createDishDto);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateDishDto: any) {
    return this.dishesService.update(id, updateDishDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.dishesService.remove(id);
  }
}
