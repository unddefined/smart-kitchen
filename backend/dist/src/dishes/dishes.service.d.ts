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
            description: string | null;
            displayOrder: number;
            createdAt: Date;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        isActive: boolean;
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
            description: string | null;
            displayOrder: number;
            createdAt: Date;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        isActive: boolean;
    }>;
    findByCategory(categoryId: number): Promise<({
        station: {
            id: number;
            name: string;
            createdAt: Date;
        };
        category: {
            id: number;
            name: string;
            description: string | null;
            displayOrder: number;
            createdAt: Date;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        isActive: boolean;
    })[]>;
    findByStation(stationId: number): Promise<({
        station: {
            id: number;
            name: string;
            createdAt: Date;
        };
        category: {
            id: number;
            name: string;
            description: string | null;
            displayOrder: number;
            createdAt: Date;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        isActive: boolean;
    })[]>;
    create(data: any): Promise<{
        station: {
            id: number;
            name: string;
            createdAt: Date;
        };
        category: {
            id: number;
            name: string;
            description: string | null;
            displayOrder: number;
            createdAt: Date;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        isActive: boolean;
    }>;
    update(id: number, data: any): Promise<{
        station: {
            id: number;
            name: string;
            createdAt: Date;
        };
        category: {
            id: number;
            name: string;
            description: string | null;
            displayOrder: number;
            createdAt: Date;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        isActive: boolean;
    }>;
    remove(id: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        isActive: boolean;
    }>;
    searchByName(name: string): Promise<({
        station: {
            id: number;
            name: string;
            createdAt: Date;
        };
        category: {
            id: number;
            name: string;
            description: string | null;
            displayOrder: number;
            createdAt: Date;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        isActive: boolean;
    })[]>;
}
