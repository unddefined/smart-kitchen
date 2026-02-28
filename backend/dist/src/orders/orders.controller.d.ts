import { OrdersService } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(createOrderDto: any): Promise<{
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        createdAt: Date;
        mealTime: Date | null;
        mealType: string | null;
        startTime: Date | null;
        remark: string | null;
        updatedAt: Date;
        id: number;
    }>;
    findAll(): Promise<({
        orderItems: ({
            dish: {
                createdAt: Date;
                id: number;
                name: string;
                countable: boolean;
                stationId: number;
                categoryId: number;
                shortcutCode: string | null;
                recipeId: number | null;
                isActive: boolean;
            };
        } & {
            status: string;
            createdAt: Date;
            remark: string | null;
            id: number;
            orderId: number;
            dishId: number;
            quantity: number;
            weight: string | null;
            priority: number;
            servedAt: Date | null;
            countable: boolean;
        })[];
    } & {
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        createdAt: Date;
        mealTime: Date | null;
        mealType: string | null;
        startTime: Date | null;
        remark: string | null;
        updatedAt: Date;
        id: number;
    })[]>;
    findOne(id: number): Promise<{
        orderItems: ({
            dish: {
                createdAt: Date;
                id: number;
                name: string;
                countable: boolean;
                stationId: number;
                categoryId: number;
                shortcutCode: string | null;
                recipeId: number | null;
                isActive: boolean;
            };
        } & {
            status: string;
            createdAt: Date;
            remark: string | null;
            id: number;
            orderId: number;
            dishId: number;
            quantity: number;
            weight: string | null;
            priority: number;
            servedAt: Date | null;
            countable: boolean;
        })[];
    } & {
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        createdAt: Date;
        mealTime: Date | null;
        mealType: string | null;
        startTime: Date | null;
        remark: string | null;
        updatedAt: Date;
        id: number;
    }>;
    findOrderItems(id: number): Promise<({
        dish: {
            createdAt: Date;
            id: number;
            name: string;
            countable: boolean;
            stationId: number;
            categoryId: number;
            shortcutCode: string | null;
            recipeId: number | null;
            isActive: boolean;
        };
    } & {
        status: string;
        createdAt: Date;
        remark: string | null;
        id: number;
        orderId: number;
        dishId: number;
        quantity: number;
        weight: string | null;
        priority: number;
        servedAt: Date | null;
        countable: boolean;
    })[]>;
    addOrderItem(orderId: number, createOrderItemDto: any): Promise<{
        dish: {
            createdAt: Date;
            id: number;
            name: string;
            countable: boolean;
            stationId: number;
            categoryId: number;
            shortcutCode: string | null;
            recipeId: number | null;
            isActive: boolean;
        };
    } & {
        status: string;
        createdAt: Date;
        remark: string | null;
        id: number;
        orderId: number;
        dishId: number;
        quantity: number;
        weight: string | null;
        priority: number;
        servedAt: Date | null;
        countable: boolean;
    }>;
    update(id: number, updateOrderDto: any): Promise<{
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        createdAt: Date;
        mealTime: Date | null;
        mealType: string | null;
        startTime: Date | null;
        remark: string | null;
        updatedAt: Date;
        id: number;
    }>;
    remove(id: number): Promise<{
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        createdAt: Date;
        mealTime: Date | null;
        mealType: string | null;
        startTime: Date | null;
        remark: string | null;
        updatedAt: Date;
        id: number;
    }>;
}
