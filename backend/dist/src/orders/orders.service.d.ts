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
        mealTime: string | null;
        updatedAt: Date;
    }>;
    findAll(): Promise<({
        orderItems: ({
            dish: {
                id: number;
                name: string;
                createdAt: Date;
                recipeId: number | null;
                shortcutCode: string | null;
                stationId: number;
                categoryId: number;
            };
        } & {
            id: number;
            createdAt: Date;
            countable: boolean;
            status: string;
            quantity: number;
            weight: string | null;
            priority: number;
            remark: string | null;
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
        mealTime: string | null;
        updatedAt: Date;
    })[]>;
    findOne(id: number): Promise<({
        orderItems: ({
            dish: {
                id: number;
                name: string;
                createdAt: Date;
                recipeId: number | null;
                shortcutCode: string | null;
                stationId: number;
                categoryId: number;
            };
        } & {
            id: number;
            createdAt: Date;
            countable: boolean;
            status: string;
            quantity: number;
            weight: string | null;
            priority: number;
            remark: string | null;
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
        mealTime: string | null;
        updatedAt: Date;
    }) | null>;
    update(id: number, updateOrderDto: any): Promise<{
        id: number;
        createdAt: Date;
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        mealTime: string | null;
        updatedAt: Date;
    }>;
    remove(id: number): Promise<{
        id: number;
        createdAt: Date;
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        mealTime: string | null;
        updatedAt: Date;
    }>;
}
