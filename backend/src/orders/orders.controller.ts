import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: any) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  findAll(@Query() queryParams?: any) {
    return this.ordersService.findAll(queryParams || {});
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Get(':id/items')
  findOrderItems(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOrderItems(id);
  }

  @Post(':id/items')
  addOrderItem(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() createOrderItemDto: any,
  ) {
    return this.ordersService.addOrderItem(orderId, createOrderItemDto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateOrderDto: any) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Patch(':id/cancel')
  cancelOrder(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.cancelOrder(id);
  }

  /**
   * 起菜 - 将订单状态更新为 serving 并初始化菜品优先级
   * PATCH /api/orders/:id/start
   */
  @Patch(':id/start')
  async startServing(@Param('id', ParseIntPipe) id: number) {
    return await this.ordersService.startServing(id);
  }

  /**
   * 催菜 - 将订单状态更新为 urged 并在菜品备注中添加催菜标记
   * PATCH /api/orders/:id/urge
   */
  @Patch(':id/urge')
  async urgeOrder(@Param('id', ParseIntPipe) id: number) {
    return await this.ordersService.urgeOrder(id);
  }

  /**
   * 暂停 - 将订单状态更新为 started
   * PATCH /api/orders/:id/pause
   */
  @Patch(':id/pause')
  async pauseOrder(@Param('id', ParseIntPipe) id: number) {
    return await this.ordersService.pauseOrder(id);
  }

  /**
   * 恢复 - 催菜后上了一道菜时自动恢复
   * POST /api/orders/:id/resume
   */
  @Post(':id/resume')
  async resumeOrder(@Param('id', ParseIntPipe) id: number) {
    return await this.ordersService.resumeOrderAfterServe(id);
  }

  /**
   * 完成订单 - 当所有菜品上完后手动确认完成
   * PATCH /api/orders/:id/complete
   */
  @Patch(':id/complete')
  async completeOrder(@Param('id', ParseIntPipe) id: number) {
    return await this.ordersService.completeOrder(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.remove(id);
  }

  /**
   * 删除订单中的某个菜品项
   * DELETE /api/orders/:orderId/items/:itemId
   */
  @Delete(':orderId/items/:itemId')
  async removeOrderItem(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return await this.ordersService.removeOrderItem(orderId, itemId);
  }

  /**
   * 更新订单中的某个菜品项
   * PUT /api/orders/:orderId/items/:itemId
   */
  @Put(':orderId/items/:itemId')
  async updateOrderItem(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() updateData: any,
  ) {
    return await this.ordersService.updateOrderItem(orderId, itemId, updateData);
  }
}
