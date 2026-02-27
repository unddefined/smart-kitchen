import { ServingService } from './serving.service';
export declare class ServingController {
    private readonly servingService;
    private readonly logger;
    constructor(servingService: ServingService);
    getOrderServingStatus(orderId: number): Promise<{
        orderId: number;
        hallNumber: string;
        status: string;
        itemCount: {
            pending: number;
            preparing: number;
            ready: number;
            served: number;
            total: number;
        };
        items: {
            id: number;
            dishName: string;
            quantity: number;
            status: string;
            priority: number;
            createdAt: Date;
        }[];
    }>;
    updateItemPriority(itemId: number, updateData: {
        priority: number;
        reason?: string;
    }): Promise<{
        success: boolean;
        itemId: number;
        priority: number;
        message: string;
    }>;
    completeDishPreparation(itemId: number): Promise<{
        success: boolean;
        itemId: number;
        status: string;
        message: string;
    }>;
    serveDish(itemId: number): Promise<{
        success: boolean;
        itemId: number;
        status: string;
        servedAt: Date;
        message: string;
    }>;
    autoAdjustOrderPriorities(orderId: number): Promise<{
        success: boolean;
        orderId: number;
        adjustments: {
            itemId: number;
            oldPriority: number;
            newPriority: number;
        }[];
        message: string;
    }>;
    getServingAlerts(): Promise<{
        id: number;
        orderId: number;
        dishName: string;
        hallNumber: string;
        priority: number;
        status: string;
        createdAt: Date;
        isOverdue: boolean;
    }[]>;
    detectUrgentDishes(): Promise<{
        id: number;
        orderId: number;
        dishName: string;
        hallNumber: string;
        priority: number;
        status: string;
        createdAt: Date;
    }[]>;
    getOrderSequenceConfig(): Promise<{
        sequence: {
            category: string;
            priority: number;
            color: string;
        }[];
        rules: {
            later_addition: string;
            priority_boost: string;
            color_coding: {
                red: string;
                yellow: string;
                green: string;
                gray: string;
                negative_one: string;
            };
        };
    }>;
}
