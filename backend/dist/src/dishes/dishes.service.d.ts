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
        needPrep: boolean;
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
        needPrep: boolean;
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
        needPrep: boolean;
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
        needPrep: boolean;
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
        needPrep: boolean;
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
        needPrep: boolean;
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
        needPrep: boolean;
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
        needPrep: boolean;
        isActive: boolean;
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
        needPrep: boolean;
        isActive: boolean;
    })[]>;
    batchUpdatePrepRequirement(dishIds: number[], needPrep: boolean): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getCategoriesInServingOrder(): Promise<{
        id: number;
        name: string;
        description: string | null;
        displayOrder: number;
        createdAt: Date;
    }[]>;
    getDishesGroupedByCategory(): Promise<any[]>;
}
