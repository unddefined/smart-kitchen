import { PrismaService } from '../prisma/prisma.service';
export declare class ServingService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private calculateDishPriority;
    getOrder(orderId: number): Promise<{
        orderItems: ({
            dish: {
                id: number;
                name: string;
                createdAt: Date;
                stationId: number;
                categoryId: number;
                shortcutCode: string;
                recipeId: number;
            };
        } & {
            id: number;
            createdAt: Date;
            countable: boolean;
            status: string;
            remark: string;
            orderId: number;
            dishId: number;
            quantity: number;
            weight: string;
            priority: number;
            servedAt: Date;
        })[];
    } & {
        id: number;
        createdAt: Date;
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        mealTime: string;
        updatedAt: Date;
    }>;
    getAllOrders(): Promise<({
        orderItems: ({
            dish: {
                id: number;
                name: string;
                createdAt: Date;
                stationId: number;
                categoryId: number;
                shortcutCode: string;
                recipeId: number;
            };
        } & {
            id: number;
            createdAt: Date;
            countable: boolean;
            status: string;
            remark: string;
            orderId: number;
            dishId: number;
            quantity: number;
            weight: string;
            priority: number;
            servedAt: Date;
        })[];
    } & {
        id: number;
        createdAt: Date;
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        mealTime: string;
        updatedAt: Date;
    })[]>;
    updateOrderStatus(orderId: number, status: string): Promise<{
        id: number;
        createdAt: Date;
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        mealTime: string;
        updatedAt: Date;
    }>;
    getOrderItem(itemId: number): Promise<{
        dish: {
            id: number;
            name: string;
            createdAt: Date;
            stationId: number;
            categoryId: number;
            shortcutCode: string;
            recipeId: number;
        };
        order: {
            id: number;
            createdAt: Date;
            hallNumber: string;
            peopleCount: number;
            tableCount: number;
            status: string;
            mealTime: string;
            updatedAt: Date;
        };
    } & {
        id: number;
        createdAt: Date;
        countable: boolean;
        status: string;
        remark: string;
        orderId: number;
        dishId: number;
        quantity: number;
        weight: string;
        priority: number;
        servedAt: Date;
    }>;
    updateOrderItemStatus(itemId: number, status: string): Promise<{
        id: number;
        createdAt: Date;
        countable: boolean;
        status: string;
        remark: string;
        orderId: number;
        dishId: number;
        quantity: number;
        weight: string;
        priority: number;
        servedAt: Date;
    }>;
    updateOrderItemPriority(itemId: number, priority: number): Promise<{
        id: number;
        createdAt: Date;
        countable: boolean;
        status: string;
        remark: string;
        orderId: number;
        dishId: number;
        quantity: number;
        weight: string;
        priority: number;
        servedAt: Date;
    }>;
    markAsServed(itemId: number): Promise<{
        id: number;
        createdAt: Date;
        countable: boolean;
        status: string;
        remark: string;
        orderId: number;
        dishId: number;
        quantity: number;
        weight: string;
        priority: number;
        servedAt: Date;
    }>;
    getPendingItems(): Promise<({
        dish: {
            id: number;
            name: string;
            createdAt: Date;
            stationId: number;
            categoryId: number;
            shortcutCode: string;
            recipeId: number;
        };
        order: {
            id: number;
            createdAt: Date;
            hallNumber: string;
            peopleCount: number;
            tableCount: number;
            status: string;
            mealTime: string;
            updatedAt: Date;
        };
    } & {
        id: number;
        createdAt: Date;
        countable: boolean;
        status: string;
        remark: string;
        orderId: number;
        dishId: number;
        quantity: number;
        weight: string;
        priority: number;
        servedAt: Date;
    })[]>;
    getServedItems(): Promise<({
        dish: {
            id: number;
            name: string;
            createdAt: Date;
            stationId: number;
            categoryId: number;
            shortcutCode: string;
            recipeId: number;
        };
        order: {
            id: number;
            createdAt: Date;
            hallNumber: string;
            peopleCount: number;
            tableCount: number;
            status: string;
            mealTime: string;
            updatedAt: Date;
        };
    } & {
        id: number;
        createdAt: Date;
        countable: boolean;
        status: string;
        remark: string;
        orderId: number;
        dishId: number;
        quantity: number;
        weight: string;
        priority: number;
        servedAt: Date;
    })[]>;
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
    updateItemPriority(itemId: number, priority: number, reason?: string): Promise<{
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
}
