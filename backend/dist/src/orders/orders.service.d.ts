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
        mealTime: string;
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
    findOne(id: number): Promise<{
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
    update(id: number, updateOrderDto: any): Promise<{
        id: number;
        createdAt: Date;
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        mealTime: string;
        updatedAt: Date;
    }>;
    remove(id: number): Promise<{
        id: number;
        createdAt: Date;
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        mealTime: string;
        updatedAt: Date;
    }>;
}
