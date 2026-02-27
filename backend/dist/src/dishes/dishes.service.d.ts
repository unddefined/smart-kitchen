import { PrismaService } from '../prisma/prisma.service';
export declare class DishesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        station: {
            id: number;
            name: string;
            createdAt: Date;
        };
        category: {
            id: number;
            name: string;
            createdAt: Date;
            description: string;
            displayOrder: number;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        stationId: number;
        categoryId: number;
        shortcutCode: string;
        recipeId: number;
    })[]>;
    findOne(id: number): Promise<{
        station: {
            id: number;
            name: string;
            createdAt: Date;
        };
        category: {
            id: number;
            name: string;
            createdAt: Date;
            description: string;
            displayOrder: number;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        stationId: number;
        categoryId: number;
        shortcutCode: string;
        recipeId: number;
    }>;
    create(data: any): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        stationId: number;
        categoryId: number;
        shortcutCode: string;
        recipeId: number;
    }>;
    update(id: number, data: any): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        stationId: number;
        categoryId: number;
        shortcutCode: string;
        recipeId: number;
    }>;
    remove(id: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        stationId: number;
        categoryId: number;
        shortcutCode: string;
        recipeId: number;
    }>;
}
