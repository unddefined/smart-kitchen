import { PrismaService } from '../prisma/prisma.service';
export declare class OrdersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createOrderDto: any): Promise<{
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
    findAll(): Promise<({
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
            status: string;
            remark: string | null;
            orderId: number;
            dishId: number;
            quantity: number;
            weight: string | null;
            priority: number;
            servedAt: Date | null;
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
    findOne(id: number): Promise<{
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
            status: string;
            remark: string | null;
            orderId: number;
            dishId: number;
            quantity: number;
            weight: string | null;
            priority: number;
            servedAt: Date | null;
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
    findOrderItems(orderId: number): Promise<({
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
        status: string;
        remark: string | null;
        orderId: number;
        dishId: number;
        quantity: number;
        weight: string | null;
        priority: number;
        servedAt: Date | null;
    })[]>;
    addOrderItem(orderId: number, createOrderItemDto: any): Promise<{
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
        status: string;
        remark: string | null;
        orderId: number;
        dishId: number;
        quantity: number;
        weight: string | null;
        priority: number;
        servedAt: Date | null;
    }>;
    update(id: number, updateOrderDto: any): Promise<{
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
    cancelOrder(id: number): Promise<{
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
    remove(id: number): Promise<{
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
}
