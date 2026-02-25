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
            description: string | null;
            displayOrder: number;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        recipeId: number | null;
        shortcutCode: string | null;
        stationId: number;
        categoryId: number;
    })[]>;
    findOne(id: number): Promise<({
        station: {
            id: number;
            name: string;
            createdAt: Date;
        };
        category: {
            id: number;
            name: string;
            createdAt: Date;
            description: string | null;
            displayOrder: number;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        recipeId: number | null;
        shortcutCode: string | null;
        stationId: number;
        categoryId: number;
    }) | null>;
    create(data: any): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        recipeId: number | null;
        shortcutCode: string | null;
        stationId: number;
        categoryId: number;
    }>;
    update(id: number, data: any): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        recipeId: number | null;
        shortcutCode: string | null;
        stationId: number;
        categoryId: number;
    }>;
    remove(id: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        recipeId: number | null;
        shortcutCode: string | null;
        stationId: number;
        categoryId: number;
    }>;
}
