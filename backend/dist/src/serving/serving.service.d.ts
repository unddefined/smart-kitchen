import { PrismaService } from '../prisma/prisma.service';
export declare class ServingService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getOrder(orderId: number): Promise<({
        orderItems: ({
            dish: {
                recipe: string | null;
                name: string;
                createdAt: Date;
                id: number;
                stationId: number;
                categoryId: number;
                shortcutCode: string | null;
            };
        } & {
            createdAt: Date;
            id: number;
            status: string;
            orderId: number;
            dishId: number;
            quantity: number;
            weight: string | null;
            priority: number;
            remark: string | null;
            countable: boolean;
            servedAt: Date | null;
        })[];
    } & {
        createdAt: Date;
        id: number;
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        mealTime: string | null;
        updatedAt: Date;
    }) | null>;
    getAllOrders(): Promise<({
        orderItems: ({
            dish: {
                recipe: string | null;
                name: string;
                createdAt: Date;
                id: number;
                stationId: number;
                categoryId: number;
                shortcutCode: string | null;
            };
        } & {
            createdAt: Date;
            id: number;
            status: string;
            orderId: number;
            dishId: number;
            quantity: number;
            weight: string | null;
            priority: number;
            remark: string | null;
            countable: boolean;
            servedAt: Date | null;
        })[];
    } & {
        createdAt: Date;
        id: number;
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        mealTime: string | null;
        updatedAt: Date;
    })[]>;
    updateOrderStatus(orderId: number, status: string): Promise<{
        createdAt: Date;
        id: number;
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        mealTime: string | null;
        updatedAt: Date;
    }>;
    getOrderItem(itemId: number): Promise<({
        dish: {
            recipe: string | null;
            name: string;
            createdAt: Date;
            id: number;
            stationId: number;
            categoryId: number;
            shortcutCode: string | null;
        };
        order: {
            createdAt: Date;
            id: number;
            hallNumber: string;
            peopleCount: number;
            tableCount: number;
            status: string;
            mealTime: string | null;
            updatedAt: Date;
        };
    } & {
        createdAt: Date;
        id: number;
        status: string;
        orderId: number;
        dishId: number;
        quantity: number;
        weight: string | null;
        priority: number;
        remark: string | null;
        countable: boolean;
        servedAt: Date | null;
    }) | null>;
    updateOrderItemStatus(itemId: number, status: string): Promise<{
        createdAt: Date;
        id: number;
        status: string;
        orderId: number;
        dishId: number;
        quantity: number;
        weight: string | null;
        priority: number;
        remark: string | null;
        countable: boolean;
        servedAt: Date | null;
    }>;
    updateOrderItemPriority(itemId: number, priority: number): Promise<{
        createdAt: Date;
        id: number;
        status: string;
        orderId: number;
        dishId: number;
        quantity: number;
        weight: string | null;
        priority: number;
        remark: string | null;
        countable: boolean;
        servedAt: Date | null;
    }>;
    markAsServed(itemId: number): Promise<{
        createdAt: Date;
        id: number;
        status: string;
        orderId: number;
        dishId: number;
        quantity: number;
        weight: string | null;
        priority: number;
        remark: string | null;
        countable: boolean;
        servedAt: Date | null;
    }>;
    getPendingItems(): Promise<({
        dish: {
            recipe: string | null;
            name: string;
            createdAt: Date;
            id: number;
            stationId: number;
            categoryId: number;
            shortcutCode: string | null;
        };
        order: {
            createdAt: Date;
            id: number;
            hallNumber: string;
            peopleCount: number;
            tableCount: number;
            status: string;
            mealTime: string | null;
            updatedAt: Date;
        };
    } & {
        createdAt: Date;
        id: number;
        status: string;
        orderId: number;
        dishId: number;
        quantity: number;
        weight: string | null;
        priority: number;
        remark: string | null;
        countable: boolean;
        servedAt: Date | null;
    })[]>;
    getServedItems(): Promise<({
        dish: {
            recipe: string | null;
            name: string;
            createdAt: Date;
            id: number;
            stationId: number;
            categoryId: number;
            shortcutCode: string | null;
        };
        order: {
            createdAt: Date;
            id: number;
            hallNumber: string;
            peopleCount: number;
            tableCount: number;
            status: string;
            mealTime: string | null;
            updatedAt: Date;
        };
    } & {
        createdAt: Date;
        id: number;
        status: string;
        orderId: number;
        dishId: number;
        quantity: number;
        weight: string | null;
        priority: number;
        remark: string | null;
        countable: boolean;
        servedAt: Date | null;
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
        servedAt: Date | null;
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
