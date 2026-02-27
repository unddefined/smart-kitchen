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
                shortcutCode: string | null;
                recipeId: number | null;
                countable: boolean;
                isActive: boolean;
            };
        } & {
            id: number;
            createdAt: Date;
            countable: boolean;
            status: string;
            remark: string | null;
            quantity: number;
            weight: string | null;
            priority: number;
            servedAt: Date | null;
            orderId: number;
            dishId: number;
        })[];
    } & {
        id: number;
        createdAt: Date;
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        mealTime: Date | null;
        mealType: string | null;
        startTime: Date | null;
        remark: string | null;
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
                shortcutCode: string | null;
                recipeId: number | null;
                countable: boolean;
                isActive: boolean;
            };
        } & {
            id: number;
            createdAt: Date;
            countable: boolean;
            status: string;
            remark: string | null;
            quantity: number;
            weight: string | null;
            priority: number;
            servedAt: Date | null;
            orderId: number;
            dishId: number;
        })[];
    } & {
        id: number;
        createdAt: Date;
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        mealTime: Date | null;
        mealType: string | null;
        startTime: Date | null;
        remark: string | null;
        updatedAt: Date;
    })[]>;
    updateOrderStatus(orderId: number, status: string): Promise<{
        id: number;
        createdAt: Date;
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        mealTime: Date | null;
        mealType: string | null;
        startTime: Date | null;
        remark: string | null;
        updatedAt: Date;
    }>;
    getOrderItem(itemId: number): Promise<{
        dish: {
            id: number;
            name: string;
            createdAt: Date;
            stationId: number;
            categoryId: number;
            shortcutCode: string | null;
            recipeId: number | null;
            countable: boolean;
            isActive: boolean;
        };
        order: {
            id: number;
            createdAt: Date;
            hallNumber: string;
            peopleCount: number;
            tableCount: number;
            status: string;
            mealTime: Date | null;
            mealType: string | null;
            startTime: Date | null;
            remark: string | null;
            updatedAt: Date;
        };
    } & {
        id: number;
        createdAt: Date;
        countable: boolean;
        status: string;
        remark: string | null;
        quantity: number;
        weight: string | null;
        priority: number;
        servedAt: Date | null;
        orderId: number;
        dishId: number;
    }>;
    updateOrderItemStatus(itemId: number, status: string): Promise<{
        id: number;
        createdAt: Date;
        countable: boolean;
        status: string;
        remark: string | null;
        quantity: number;
        weight: string | null;
        priority: number;
        servedAt: Date | null;
        orderId: number;
        dishId: number;
    }>;
    updateOrderItemPriority(itemId: number, priority: number): Promise<{
        id: number;
        createdAt: Date;
        countable: boolean;
        status: string;
        remark: string | null;
        quantity: number;
        weight: string | null;
        priority: number;
        servedAt: Date | null;
        orderId: number;
        dishId: number;
    }>;
    markAsServed(itemId: number): Promise<{
        id: number;
        createdAt: Date;
        countable: boolean;
        status: string;
        remark: string | null;
        quantity: number;
        weight: string | null;
        priority: number;
        servedAt: Date | null;
        orderId: number;
        dishId: number;
    }>;
    getPendingItems(): Promise<({
        dish: {
            id: number;
            name: string;
            createdAt: Date;
            stationId: number;
            categoryId: number;
            shortcutCode: string | null;
            recipeId: number | null;
            countable: boolean;
            isActive: boolean;
        };
        order: {
            id: number;
            createdAt: Date;
            hallNumber: string;
            peopleCount: number;
            tableCount: number;
            status: string;
            mealTime: Date | null;
            mealType: string | null;
            startTime: Date | null;
            remark: string | null;
            updatedAt: Date;
        };
    } & {
        id: number;
        createdAt: Date;
        countable: boolean;
        status: string;
        remark: string | null;
        quantity: number;
        weight: string | null;
        priority: number;
        servedAt: Date | null;
        orderId: number;
        dishId: number;
    })[]>;
    getServedItems(): Promise<({
        dish: {
            id: number;
            name: string;
            createdAt: Date;
            stationId: number;
            categoryId: number;
            shortcutCode: string | null;
            recipeId: number | null;
            countable: boolean;
            isActive: boolean;
        };
        order: {
            id: number;
            createdAt: Date;
            hallNumber: string;
            peopleCount: number;
            tableCount: number;
            status: string;
            mealTime: Date | null;
            mealType: string | null;
            startTime: Date | null;
            remark: string | null;
            updatedAt: Date;
        };
    } & {
        id: number;
        createdAt: Date;
        countable: boolean;
        status: string;
        remark: string | null;
        quantity: number;
        weight: string | null;
        priority: number;
        servedAt: Date | null;
        orderId: number;
        dishId: number;
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
