import { PrismaService } from '../prisma/prisma.service';
export declare class DishesService {
    private prisma;
    private readonly logger;
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
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        needPrep: boolean;
        isActive: boolean;
        createdAt: Date;
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
            description: string | null;
            displayOrder: number;
        };
    } & {
        id: number;
        name: string;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        needPrep: boolean;
        isActive: boolean;
        createdAt: Date;
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
            createdAt: Date;
            description: string | null;
            displayOrder: number;
        };
    } & {
        id: number;
        name: string;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        needPrep: boolean;
        isActive: boolean;
        createdAt: Date;
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
            createdAt: Date;
            description: string | null;
            displayOrder: number;
        };
    } & {
        id: number;
        name: string;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        needPrep: boolean;
        isActive: boolean;
        createdAt: Date;
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
            createdAt: Date;
            description: string | null;
            displayOrder: number;
        };
    } & {
        id: number;
        name: string;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        needPrep: boolean;
        isActive: boolean;
        createdAt: Date;
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
            createdAt: Date;
            description: string | null;
            displayOrder: number;
        };
    } & {
        id: number;
        name: string;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        needPrep: boolean;
        isActive: boolean;
        createdAt: Date;
    }>;
    remove(id: number): Promise<{
        id: number;
        name: string;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        needPrep: boolean;
        isActive: boolean;
        createdAt: Date;
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
            createdAt: Date;
            description: string | null;
            displayOrder: number;
        };
    } & {
        id: number;
        name: string;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        needPrep: boolean;
        isActive: boolean;
        createdAt: Date;
    })[]>;
    findByPrepRequirement(needPrep: boolean): Promise<({
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
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        needPrep: boolean;
        isActive: boolean;
        createdAt: Date;
    })[]>;
    batchUpdatePrepRequirement(dishIds: number[], needPrep: boolean): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getCategoriesInServingOrder(): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        description: string | null;
        displayOrder: number;
    }[]>;
    getDishesGroupedByCategory(): Promise<any[]>;
}
