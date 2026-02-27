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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestController = void 0;
const common_1 = require("@nestjs/common");
const mock_data_service_1 = require("./mock-data.service");
let TestController = class TestController {
    constructor(mockDataService) {
        this.mockDataService = mockDataService;
    }
    getDishes() {
        return {
            success: true,
            data: this.mockDataService.getDishes(),
            message: '获取菜品列表成功',
        };
    }
    getOrders() {
        return {
            success: true,
            data: this.mockDataService.getOrders(),
            message: '获取订单列表成功',
        };
    }
    getAlerts() {
        return {
            success: true,
            data: this.mockDataService.getServingAlerts(),
            message: '获取提醒列表成功',
        };
    }
    getTestHealth() {
        return {
            success: true,
            message: '测试API服务正常运行',
            timestamp: new Date().toISOString(),
        };
    }
};
exports.TestController = TestController;
__decorate([
    (0, common_1.Get)('dishes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestController.prototype, "getDishes", null);
__decorate([
    (0, common_1.Get)('orders'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)('alerts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestController.prototype, "getAlerts", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestController.prototype, "getTestHealth", null);
exports.TestController = TestController = __decorate([
    (0, common_1.Controller)('test'),
    __metadata("design:paramtypes", [mock_data_service_1.MockDataService])
], TestController);
//# sourceMappingURL=test.controller.js.map