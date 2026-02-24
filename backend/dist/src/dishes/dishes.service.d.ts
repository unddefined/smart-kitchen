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
        recipe: string | null;
        name: string;
        createdAt: Date;
        id: number;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
    })[]>;
    findOne(id: number): Promise<({
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
        recipe: string | null;
        name: string;
        createdAt: Date;
        id: number;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
    }) | null>;
    create(data: any): Promise<{
        recipe: string | null;
        name: string;
        createdAt: Date;
        id: number;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
    }>;
    update(id: number, data: any): Promise<{
        recipe: string | null;
        name: string;
        createdAt: Date;
        id: number;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
    }>;
    remove(id: number): Promise<{
        recipe: string | null;
        name: string;
        createdAt: Date;
        id: number;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
    }>;
}
