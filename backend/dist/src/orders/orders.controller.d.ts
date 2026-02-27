import { OrdersService } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
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
