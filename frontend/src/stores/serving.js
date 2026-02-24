import { defineStore } from 'pinia';
import { message } from 'ant-design-vue';

export const useServingStore = defineStore('serving', {
  state: () => ({
    orders: [],
    currentOrder: null,
    loading: false,
    alerts: {
      highPriority: [],
      mediumPriority: [],
      lowPriority: []
    }
  }),

  getters: {
    // 获取需要催菜的订单
    urgentOrders: (state) => {
      return state.orders.filter(order => 
        order.items?.some(item => 
          item.currentPriority < item.shouldPriority || item.isAddedLater
        )
      );
    },

    // 按优先级分组的菜品
    dishesByPriority: (state) => {
      const groups = {
        red: [],    // 优先级3：催菜
        yellow: [], // 优先级2：等一下  
        green: [],  // 优先级1：不急
        gray: []    // 优先级0：未起菜
      };

      state.orders.forEach(order => {
        order.items?.forEach(item => {
          if (item.status !== 'served') {
            const color = getColorByPriority(item.priority);
            if (groups[color]) {
              groups[color].push({
                ...item,
                hallNumber: order.hallNumber,
                orderId: order.orderId
              });
            }
          }
        });
      });

      return groups;
    },

    // 统计信息
    statistics: (state) => {
      let totalOrders = 0;
      let totalItems = 0;
      let servedItems = 0;
      let pendingItems = 0;

      state.orders.forEach(order => {
        totalOrders++;
        if (order.items) {
          totalItems += order.items.length;
          order.items.forEach(item => {
            if (item.status === 'served') servedItems++;
            if (item.status === 'pending') pendingItems++;
          });
        }
      });

      return {
        totalOrders,
        totalItems,
        servedItems,
        pendingItems,
        completionRate: totalItems > 0 ? Math.round((servedItems / totalItems) * 100) : 0
      };
    }
  },

  actions: {
    // 加载订单数据
    async loadOrders(filters = {}) {
      this.loading = true;
      try {
        // 模拟API调用
        const response = await fetch('/api/serving/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(filters)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        this.orders = data.orders || [];
        
        // 同时加载提醒信息
        await this.loadAlerts();
        
      } catch (error) {
        message.error('加载订单失败: ' + error.message);
        // 使用模拟数据进行演示
        this.loadMockData();
      } finally {
        this.loading = false;
      }
    },

    // 加载提醒信息
    async loadAlerts() {
      try {
        const response = await fetch('/api/serving/alerts');
        if (response.ok) {
          const data = await response.json();
          this.alerts = data;
        }
      } catch (error) {
        console.warn('加载提醒信息失败:', error);
      }
    },

    // 更新菜品优先级（催菜）
    async updateItemPriority(itemId, priority, reason) {
      try {
        const response = await fetch(`/api/serving/items/${itemId}/priority`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ priority, reason })
        });

        if (!response.ok) {
          throw new Error('更新优先级失败');
        }

        const data = await response.json();
        message.success(data.message || '优先级更新成功');
        
        // 重新加载订单数据
        await this.loadOrders();
        
        return data;
      } catch (error) {
        message.error('更新优先级失败: ' + error.message);
        throw error;
      }
    },

    // 标记菜品制作完成
    async completePreparation(itemId) {
      try {
        const response = await fetch(`/api/serving/items/${itemId}/complete-prep`, {
          method: 'POST'
        });

        if (!response.ok) {
          throw new Error('标记完成失败');
        }

        const data = await response.json();
        message.success(data.message || '标记完成成功');
        
        // 重新加载订单数据
        await this.loadOrders();
        
        return data;
      } catch (error) {
        message.error('标记完成失败: ' + error.message);
        throw error;
      }
    },

    // 标记菜品已上菜
    async serveDish(itemId) {
      try {
        const response = await fetch(`/api/serving/items/${itemId}/serve`, {
          method: 'POST'
        });

        if (!response.ok) {
          throw new Error('上菜失败');
        }

        const data = await response.json();
        message.success(data.message || '上菜成功');
        
        // 重新加载订单数据
        await this.loadOrders();
        
        return data;
      } catch (error) {
        message.error('上菜失败: ' + error.message);
        throw error;
      }
    },

    // 自动调整订单优先级
    async autoAdjustOrderPriorities(orderId) {
      try {
        const response = await fetch(`/api/serving/orders/${orderId}/auto-adjust`, {
          method: 'POST'
        });

        if (!response.ok) {
          throw new Error('自动调整失败');
        }

        const data = await response.json();
        message.success(data.message || '自动调整成功');
        
        // 重新加载订单数据
        await this.loadOrders();
        
        return data;
      } catch (error) {
        message.error('自动调整失败: ' + error.message);
        throw error;
      }
    },

    // 检测紧急菜品
    async detectUrgentDishes() {
      try {
        const response = await fetch('/api/serving/urgent-dishes');
        if (response.ok) {
          const data = await response.json();
          return data.urgentDishes || [];
        }
        return [];
      } catch (error) {
        console.warn('检测紧急菜品失败:', error);
        return [];
      }
    },

    // 选择订单
    selectOrder(orderId) {
      this.currentOrder = this.orders.find(order => order.orderId === orderId) || null;
    },

    // 加载模拟数据（用于演示）
    loadMockData() {
      this.orders = [
        {
          orderId: 1,
          hallNumber: 'A01',
          peopleCount: 4,
          tableCount: 1,
          status: 'started',
          createdAt: new Date().toISOString(),
          mealTime: '午餐',
          items: [
            {
              itemId: 101,
              dishName: '椒盐基围虾',
              categoryName: '前菜',
              currentPriority: 3,
              shouldPriority: 3,
              status: 'prep',
              quantity: 2,
              weight: '中份',
              remark: '微辣',
              stationName: '热菜',
              isAddedLater: false,
              servedAt: null,
              createdAt: new Date(Date.now() - 300000).toISOString()
            },
            {
              itemId: 102,
              dishName: '红烧肉',
              categoryName: '中菜',
              currentPriority: 2,
              shouldPriority: 2,
              status: 'pending',
              quantity: 1,
              weight: null,
              remark: null,
              stationName: '热菜',
              isAddedLater: false,
              servedAt: null,
              createdAt: new Date().toISOString()
            },
            {
              itemId: 103,
              dishName: '托炉饼',
              categoryName: '中菜',
              currentPriority: 2,
              shouldPriority: 2,
              status: 'ready',
              quantity: 4, // 按4人计算
              weight: null,
              remark: null,
              stationName: '点心',
              isAddedLater: false,
              servedAt: null,
              createdAt: new Date(Date.now() - 600000).toISOString()
            }
          ]
        },
        {
          orderId: 2,
          hallNumber: 'A02',
          peopleCount: 6,
          tableCount: 2,
          status: 'started',
          createdAt: new Date(Date.now() - 900000).toISOString(),
          mealTime: '午餐',
          items: [
            {
              itemId: 201,
              dishName: '宫保鸡丁',
              categoryName: '中菜',
              currentPriority: 3, // 后来加菜
              shouldPriority: 3,
              status: 'prep',
              quantity: 1,
              weight: '大份',
              remark: '少辣',
              stationName: '热菜',
              isAddedLater: true,
              servedAt: null,
              createdAt: new Date().toISOString()
            },
            {
              itemId: 202,
              dishName: '时蔬',
              categoryName: '尾菜',
              currentPriority: 1,
              shouldPriority: 1,
              status: 'pending',
              quantity: 1,
              weight: null,
              remark: null,
              stationName: '热菜',
              isAddedLater: false,
              servedAt: null,
              createdAt: new Date(Date.now() - 1200000).toISOString()
            }
          ]
        }
      ];
    }
  }
});

// 辅助函数
function getColorByPriority(priority) {
  switch (priority) {
    case 3: return 'red';
    case 2: return 'yellow';
    case 1: return 'green';
    case 0: return 'gray';
    case -1: return 'gray';
    default: return 'gray';
  }
}