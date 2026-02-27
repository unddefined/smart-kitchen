import { OrdersService } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(createOrderDto: any): Promise<{
        createdAt: Date;
        id: number;
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        mealTime: string | null;
        updatedAt: Date;
    }>;
    findAll(): Promise<({
        orderItems: ({
            dish: {
                name: string;
                createdAt: Date;
                id: number;
                shortcutCode: string | null;
                recipeId: number | null;
                stationId: number;
                categoryId: number;
            };
        } & {
            createdAt: Date;
            id: number;
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
        createdAt: Date;
        id: number;
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        mealTime: string | null;
        updatedAt: Date;
    })[]>;
    findOne(id: number): Promise<{
        orderItems: ({
            dish: {
                name: string;
                createdAt: Date;
                id: number;
                shortcutCode: string | null;
                recipeId: number | null;
                stationId: number;
                categoryId: number;
            };
        } & {
            createdAt: Date;
            id: number;
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
        createdAt: Date;
        id: number;
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        mealTime: string | null;
        updatedAt: Date;
    }>;
    update(id: number, updateOrderDto: any): Promise<{
        createdAt: Date;
        id: number;
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        mealTime: string | null;
        updatedAt: Date;
    }>;
    remove(id: number): Promise<{
        createdAt: Date;
        id: number;
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        mealTime: string | null;
        updatedAt: Date;
    }>;
}
