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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ServingController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServingController = void 0;
const common_1 = require("@nestjs/common");
const serving_service_1 = require("./serving.service");
let ServingController = ServingController_1 = class ServingController {
    servingService;
    logger = new common_1.Logger(ServingController_1.name);
    constructor(servingService) {
        this.servingService = servingService;
    }
    async getOrderServingStatus(orderId) {
        this.logger.log(`获取订单 ${orderId} 出餐状态`);
        return await this.servingService.getOrderServingStatus(orderId);
    }
    async updateItemPriority(itemId, updateData) {
        const { priority, reason } = updateData;
        this.logger.log(`更新订单菜品 ${itemId} 优先级为 ${priority}`);
        return await this.servingService.updateItemPriority(itemId, priority, reason);
    }
    async completeDishPreparation(itemId) {
        this.logger.log(`标记订单菜品 ${itemId} 制作完成`);
        return await this.servingService.completeDishPreparation(itemId);
    }
    async serveDish(itemId) {
        this.logger.log(`标记订单菜品 ${itemId} 已上菜`);
        return await this.servingService.serveDish(itemId);
    }
    async autoAdjustOrderPriorities(orderId) {
        this.logger.log(`自动调整订单 ${orderId} 优先级`);
        return await this.servingService.autoAdjustOrderPriorities(orderId);
    }
    async getServingAlerts() {
        this.logger.log('获取所有出餐提醒');
        return await this.servingService.getServingAlerts();
    }
    async detectUrgentDishes() {
        this.logger.log('检测紧急菜品');
        return await this.servingService.detectUrgentDishes();
    }
    async getOrderSequenceConfig() {
        this.logger.log('获取出餐顺序配置');
        return {
            sequence: [
                { category: '前菜', priority: 3, color: 'red' },
                { category: '中菜', priority: 2, color: 'yellow' },
                { category: '后菜', priority: 1, color: 'green' },
                { category: '尾菜', priority: 1, color: 'green' },
            ],
            rules: {
                'later_addition': '后来加菜优先级为3级',
                'priority_boost': '前面菜品上完后后面菜品自动+1优先级',
                'color_coding': {
                    'red': '优先出(催菜)，优先级3',
                    'yellow': '等一下，优先级2',
                    'green': '不急，优先级1',
                    'gray': '未起菜，优先级0',
                    'negative_one': '已出，优先级-1'
                }
            }
        };
    }
};
exports.ServingController = ServingController;
__decorate([
    (0, common_1.Get)('orders/:orderId/status'),
    __param(0, (0, common_1.Param)('orderId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ServingController.prototype, "getOrderServingStatus", null);
__decorate([
    (0, common_1.Put)('items/:itemId/priority'),
    __param(0, (0, common_1.Param)('itemId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ServingController.prototype, "updateItemPriority", null);
__decorate([
    (0, common_1.Post)('items/:itemId/complete-prep'),
    __param(0, (0, common_1.Param)('itemId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ServingController.prototype, "completeDishPreparation", null);
__decorate([
    (0, common_1.Post)('items/:itemId/serve'),
    __param(0, (0, common_1.Param)('itemId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ServingController.prototype, "serveDish", null);
__decorate([
    (0, common_1.Post)('orders/:orderId/auto-adjust'),
    __param(0, (0, common_1.Param)('orderId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ServingController.prototype, "autoAdjustOrderPriorities", null);
__decorate([
    (0, common_1.Get)('alerts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ServingController.prototype, "getServingAlerts", null);
__decorate([
    (0, common_1.Get)('urgent-dishes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ServingController.prototype, "detectUrgentDishes", null);
__decorate([
    (0, common_1.Get)('config/order-sequence'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ServingController.prototype, "getOrderSequenceConfig", null);
exports.ServingController = ServingController = ServingController_1 = __decorate([
    (0, common_1.Controller)('serving'),
    __metadata("design:paramtypes", [serving_service_1.ServingService])
], ServingController);
//# sourceMappingURL=serving.controller.js.map