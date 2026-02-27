import { PrismaService } from '../prisma/prisma.service';
export declare class DishesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        station: {
            name: string;
            createdAt: Date;
            id: number;
        };
        category: {
            name: string;
            createdAt: Date;
            id: number;
            description: string | null;
            displayOrder: number;
        };
    } & {
        name: string;
        createdAt: Date;
        id: number;
        shortcutCode: string | null;
        recipeId: number | null;
        stationId: number;
        categoryId: number;
    })[]>;
    findOne(id: number): Promise<{
        station: {
            name: string;
            createdAt: Date;
            id: number;
        };
        category: {
            name: string;
            createdAt: Date;
            id: number;
            description: string | null;
            displayOrder: number;
        };
    } & {
        name: string;
        createdAt: Date;
        id: number;
        shortcutCode: string | null;
        recipeId: number | null;
        stationId: number;
        categoryId: number;
    }>;
    create(data: any): Promise<{
        name: string;
        createdAt: Date;
        id: number;
        shortcutCode: string | null;
        recipeId: number | null;
        stationId: number;
        categoryId: number;
    }>;
    update(id: number, data: any): Promise<{
        name: string;
        createdAt: Date;
        id: number;
        shortcutCode: string | null;
        recipeId: number | null;
        stationId: number;
        categoryId: number;
    }>;
    remove(id: number): Promise<{
        name: string;
        createdAt: Date;
        id: number;
        shortcutCode: string | null;
        recipeId: number | null;
        stationId: number;
        categoryId: number;
    }>;
}
