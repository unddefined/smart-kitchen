import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DishesService } from './dishes.service';

@Controller('dishes')
export class DishesController {
  constructor(private readonly dishesService: DishesService) {}

  @Post()
  create(@Body() createDishDto: any) {
    return this.dishesService.create(createDishDto);
  }

  @Get()
  findAll() {
    return this.dishesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dishesService.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDishDto: any) {
    return this.dishesService.update(Number(id), updateDishDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dishesService.remove(Number(id));
  }
}
