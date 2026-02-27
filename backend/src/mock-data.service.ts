import { Injectable } from '@nestjs/common';

@Injectable()
export class MockDataService {
  private dishes = [
    {
      id: 1,
      name: '红烧肉',
      category: '中菜',
      price: 38,
      description: '经典家常菜，肥而不腻',
      available: true,
    },
    {
      id: 2,
      name: '宫保鸡丁',
      category: '中菜',
      price: 28,
      description: '川菜经典，酸甜适中',
      available: true,
    },
    {
      id: 3,
      name: '麻婆豆腐',
      category: '中菜',
      price: 18,
      description: '麻辣鲜香，嫩滑可口',
      available: true,
    },
  ];

  private orders = [
    {
      id: 1,
      hallNumber: 'A01',
      peopleCount: 4,
      tableCount: 1,
      status: 'pending',
      createdAt: new Date(),
      items: [
        { dishId: 1, quantity: 2, status: 'pending' },
        { dishId: 2, quantity: 1, status: 'pending' },
      ],
    },
    {
      id: 2,
      hallNumber: 'B02',
      peopleCount: 6,
      tableCount: 2,
      status: 'preparing',
      createdAt: new Date(Date.now() - 3600000),
      items: [{ dishId: 3, quantity: 3, status: 'preparing' }],
    },
  ];

  getDishes() {
    return this.dishes;
  }

  getOrders() {
    return this.orders;
  }

  getServingAlerts() {
    return [
      {
        id: 1,
        type: 'priority_issue',
        message: '订单A01的红烧肉需要催菜',
        priority: 3,
        createdAt: new Date(),
      },
      {
        id: 2,
        type: 'waiting_serve',
        message: '订单B02的麻婆豆腐已准备好',
        priority: 2,
        createdAt: new Date(),
      },
    ];
  }
}
