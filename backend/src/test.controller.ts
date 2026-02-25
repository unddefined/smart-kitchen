import { Controller, Get } from '@nestjs/common';
import { MockDataService } from './mock-data.service';

@Controller('test')
export class TestController {
  constructor(private readonly mockDataService: MockDataService) {}

  @Get('dishes')
  getDishes() {
    return {
      success: true,
      data: this.mockDataService.getDishes(),
      message: '获取菜品列表成功',
    };
  }

  @Get('orders')
  getOrders() {
    return {
      success: true,
      data: this.mockDataService.getOrders(),
      message: '获取订单列表成功',
    };
  }

  @Get('alerts')
  getAlerts() {
    return {
      success: true,
      data: this.mockDataService.getServingAlerts(),
      message: '获取提醒列表成功',
    };
  }

  @Get('health')
  getTestHealth() {
    return {
      success: true,
      message: '测试API服务正常运行',
      timestamp: new Date().toISOString(),
    };
  }
}