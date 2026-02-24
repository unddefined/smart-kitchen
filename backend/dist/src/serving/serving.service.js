"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ServingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ServingService = ServingService_1 = class ServingService {
    prisma;
    logger = new common_1.Logger(ServingService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrder(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                orderItems: {
                    include: {
                        dish: true
                    }
                }
            }
        });
        return order;
    }
    async getAllOrders() {
        const orders = await this.prisma.order.findMany({
            include: {
                orderItems: {
                    include: {
                        dish: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return orders;
    }
    async updateOrderStatus(orderId, status) {
        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: { status }
        });
        return updatedOrder;
    }
    async getOrderItem(itemId) {
        const item = await this.prisma.orderItem.findUnique({
            where: { id: itemId },
            include: {
                order: true,
                dish: true
            }
        });
        return item;
    }
    async updateOrderItemStatus(itemId, status) {
        const updatedItem = await this.prisma.orderItem.update({
            where: { id: itemId },
            data: { status }
        });
        return updatedItem;
    }
    async updateOrderItemPriority(itemId, priority) {
        const item = await this.prisma.orderItem.findUnique({
            where: { id: itemId }
        });
        if (!item) {
            throw new Error('订单项不存在');
        }
        const updatedItem = await this.prisma.orderItem.update({
            where: { id: itemId },
            data: { priority }
        });
        return updatedItem;
    }
    async markAsServed(itemId) {
        const item = await this.prisma.orderItem.findUnique({
            where: { id: itemId }
        });
        if (!item) {
            throw new Error('订单项不存在');
        }
        const updatedItem = await this.prisma.orderItem.update({
            where: { id: itemId },
            data: {
                status: 'served',
                servedAt: new Date()
            }
        });
        return updatedItem;
    }
    async getPendingItems() {
        const items = await this.prisma.orderItem.findMany({
            where: {
                status: 'pending'
            },
            include: {
                order: true,
                dish: true
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'asc' }
            ]
        });
        return items;
    }
    async getServedItems() {
        const items = await this.prisma.orderItem.findMany({
            where: {
                status: 'served'
            },
            include: {
                order: true,
                dish: true
            },
            orderBy: {
                servedAt: 'desc'
            }
        });
        return items;
    }
    async getOrderServingStatus(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                orderItems: {
                    include: {
                        dish: true
                    }
                }
            }
        });
        if (!order) {
            throw new Error('订单不存在');
        }
        const pendingCount = order.orderItems.filter(item => item.status === 'pending').length;
        const preparingCount = order.orderItems.filter(item => item.status === 'preparing').length;
        const readyCount = order.orderItems.filter(item => item.status === 'ready').length;
        const servedCount = order.orderItems.filter(item => item.status === 'served').length;
        return {
            orderId: order.id,
            hallNumber: order.hallNumber,
            status: order.status,
            itemCount: {
                pending: pendingCount,
                preparing: preparingCount,
                ready: readyCount,
                served: servedCount,
                total: order.orderItems.length
            },
            items: order.orderItems.map(item => ({
                id: item.id,
                dishName: item.dish.name,
                quantity: item.quantity,
                status: item.status,
                priority: item.priority,
                createdAt: item.createdAt
            }))
        };
    }
    async updateItemPriority(itemId, priority, reason) {
        const item = await this.prisma.orderItem.findUnique({
            where: { id: itemId },
            include: { order: true, dish: true }
        });
        if (!item) {
            throw new Error('订单菜品不存在');
        }
        const updatedItem = await this.prisma.orderItem.update({
            where: { id: itemId },
            data: { priority }
        });
        this.logger.log(`催菜: 订单${item.order.hallNumber}的${item.dish.name}优先级调整为${priority}`, {
            orderId: item.orderId,
            dishId: item.dishId,
            priority,
            reason
        });
        return {
            success: true,
            itemId: updatedItem.id,
            priority: updatedItem.priority,
            message: `菜品${item.dish.name}优先级已更新`
        };
    }
    async completeDishPreparation(itemId) {
        const item = await this.prisma.orderItem.findUnique({
            where: { id: itemId },
            include: { order: true, dish: true }
        });
        if (!item) {
            throw new Error('订单菜品不存在');
        }
        const updatedItem = await this.prisma.orderItem.update({
            where: { id: itemId },
            data: { status: 'ready' }
        });
        this.logger.log(`菜品制作完成: 订单${item.order.hallNumber}的${item.dish.name}`, {
            orderId: item.orderId,
            dishId: item.dishId
        });
        return {
            success: true,
            itemId: updatedItem.id,
            status: updatedItem.status,
            message: `菜品${item.dish.name}制作完成`
        };
    }
    async serveDish(itemId) {
        const item = await this.prisma.orderItem.findUnique({
            where: { id: itemId },
            include: { order: true, dish: true }
        });
        if (!item) {
            throw new Error('订单菜品不存在');
        }
        const updatedItem = await this.prisma.orderItem.update({
            where: { id: itemId },
            data: {
                status: 'served',
                servedAt: new Date()
            }
        });
        this.logger.log(`菜品已上菜: 订单${item.order.hallNumber}的${item.dish.name}`, {
            orderId: item.orderId,
            dishId: item.dishId
        });
        return {
            success: true,
            itemId: updatedItem.id,
            status: updatedItem.status,
            servedAt: updatedItem.servedAt,
            message: `菜品${item.dish.name}已上菜`
        };
    }
    async autoAdjustOrderPriorities(orderId) {
        const orderItems = await this.prisma.orderItem.findMany({
            where: { orderId },
            orderBy: { createdAt: 'asc' }
        });
        const adjustments = [];
        for (let i = 0; i < orderItems.length; i++) {
            const item = orderItems[i];
            if (Date.now() - new Date(item.createdAt).getTime() > 10 * 60 * 1000) {
                if (item.priority < 3) {
                    await this.prisma.orderItem.update({
                        where: { id: item.id },
                        data: { priority: 3 }
                    });
                    adjustments.push({
                        itemId: item.id,
                        oldPriority: item.priority,
                        newPriority: 3
                    });
                }
            }
        }
        return {
            success: true,
            orderId,
            adjustments,
            message: `订单${orderId}优先级自动调整完成`
        };
    }
    async getServingAlerts() {
        const urgentItems = await this.prisma.orderItem.findMany({
            where: {
                OR: [
                    { priority: 3 },
                    {
                        AND: [
                            { status: 'pending' },
                            { createdAt: { lte: new Date(Date.now() - 30 * 60 * 1000) } }
                        ]
                    }
                ]
            },
            include: {
                order: true,
                dish: true
            },
            orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }]
        });
        return urgentItems.map(item => ({
            id: item.id,
            orderId: item.orderId,
            dishName: item.dish.name,
            hallNumber: item.order.hallNumber,
            priority: item.priority,
            status: item.status,
            createdAt: item.createdAt,
            isOverdue: Date.now() - new Date(item.createdAt).getTime() > 30 * 60 * 1000
        }));
    }
    async detectUrgentDishes() {
        const urgentItems = await this.prisma.orderItem.findMany({
            where: {
                priority: 3,
                status: { not: 'served' }
            },
            include: {
                order: true,
                dish: true
            },
            orderBy: { createdAt: 'asc' }
        });
        return urgentItems.map(item => ({
            id: item.id,
            orderId: item.orderId,
            dishName: item.dish.name,
            hallNumber: item.order.hallNumber,
            priority: item.priority,
            status: item.status,
            createdAt: item.createdAt
        }));
    }
};
exports.ServingService = ServingService;
exports.ServingService = ServingService = ServingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ServingService);
//# sourceMappingURL=serving.service.js.map