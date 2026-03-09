import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { ServingService } from './serving.service';

@Controller('serving')
export class ServingController {
  private readonly logger = new Logger(ServingController.name);

  constructor(private readonly servingService: ServingService) {}

  /**
   * 获取订单出餐状态
   * GET /api/serving/orders/:orderId/status
   */
  @Get('orders/:orderId/status')
  async getOrderServingStatus(@Param('orderId', ParseIntPipe) orderId: number) {
    this.logger.log(`获取订单 ${orderId} 出餐状态`);
    return await this.servingService.getOrderServingStatus(orderId);
  }

  /**
   * 更新菜品优先级（催菜功能）
   * PUT /api/serving/items/:itemId/priority
   */
  @Put('items/:itemId/priority')
  async updateItemPriority(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() updateData: { priority: number; reason?: string },
  ) {
    const { priority, reason } = updateData;
    this.logger.log(`更新订单菜品 ${itemId} 优先级为 ${priority}`);
    return await this.servingService.updateItemPriority(
      itemId,
      priority,
      reason,
    );
  }

  /**
   * 开始制作菜品（pending → preparing）
   * POST /api/serving/items/:itemId/start-prep
   */
  @Post('items/:itemId/start-prep')
  async startDishPreparation(@Param('itemId', ParseIntPipe) itemId: number) {
    this.logger.log(`标记订单菜品 ${itemId} 开始制作`);
    return await this.servingService.startDishPreparation(itemId);
  }

  /**
   * 标记菜品准备下锅
   * POST /api/serving/items/:itemId/complete-prep
   */
  @Post('items/:itemId/complete-prep')
  async completeDishPreparation(@Param('itemId', ParseIntPipe) itemId: number) {
    this.logger.log(`标记订单菜品 ${itemId} 准备下锅`);
    return await this.servingService.completeDishPreparation(itemId);
  }

  /**
   * 标记菜品已上菜（批量）
   * POST /api/serving/items/serve-batch
   */
  @Post('items/serve-batch')
  async serveDishes(@Body() body: { itemIds: number[] }) {
    const { itemIds } = body;
    this.logger.log(`批量标记 ${itemIds.length} 个菜品已上菜`);
    return await this.servingService.serveDishes(itemIds);
  }

  /**
   * 标记菜品已上菜（单个）
   * POST /api/serving/items/:itemId/serve
   */
  @Post('items/:itemId/serve')
  async serveDish(@Param('itemId', ParseIntPipe) itemId: number) {
    this.logger.log(`标记订单菜品 ${itemId} 已上菜`);
    return await this.servingService.serveDish(itemId);
  }

  /**
   * 自动调整订单优先级
   * POST /api/serving/orders/:orderId/auto-adjust
   */
  @Post('orders/:orderId/auto-adjust')
  async autoAdjustOrderPriorities(
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    this.logger.log(`自动调整订单 ${orderId} 优先级`);
    return await this.servingService.autoAdjustOrderPriorities(orderId);
  }

  /**
   * 获取所有出餐提醒
   * GET /api/serving/alerts
   */
  @Get('alerts')
  async getServingAlerts() {
    this.logger.log('获取所有出餐提醒');
    return await this.servingService.getServingAlerts();
  }

  /**
   * 检测紧急菜品（催菜检测）
   * GET /api/serving/urgent-dishes
   */
  @Get('urgent-dishes')
  async detectUrgentDishes() {
    this.logger.log('检测紧急菜品');
    return await this.servingService.detectUrgentDishes();
  }

  /**
   * 获取出餐顺序配置
   * GET /api/serving/config/order-sequence
   */
  @Get('config/order-sequence')
  async getOrderSequenceConfig() {
    this.logger.log('获取出餐顺序配置');
    // 这里可以从数据库视图获取配置信息
    return {
      sequence: [
        { category: '前菜', priority: 3, color: 'red' },
        { category: '中菜', priority: 2, color: 'yellow' },
        { category: '后菜', priority: 1, color: 'green' },
        { category: '尾菜', priority: 1, color: 'green' },
      ],
      rules: {
        later_addition: '后来加菜优先级为3级',
        priority_boost: '前面菜品上完后后面菜品自动+1优先级',
        color_coding: {
          red: '优先出(催菜)，优先级3',
          yellow: '等一下，优先级2',
          green: '不急，优先级1',
          gray: '未起菜，优先级0',
          negative_one: '已出，优先级-1',
        },
      },
    };
  }
}
