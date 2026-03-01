import { DishesService } from './dishes.service';
export declare class DishesController {
    private readonly dishesService;
    constructor(dishesService: DishesService);
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
    findOne(id: string): Promise<{
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
    findByCategory(categoryId: string): Promise<({
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
    findByStation(stationId: string): Promise<({
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
    findByPrepRequirement(needPrep: string): Promise<({
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
    getCategoriesInServingOrder(): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        description: string | null;
        displayOrder: number;
    }[]>;
    getDishesGroupedByCategory(): Promise<any[]>;
    create(createDishDto: any): Promise<{
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
    update(id: string, updateDishDto: any): Promise<{
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
    remove(id: string): Promise<{
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
    batchUpdatePrepRequirement(body: {
        dishIds: number[];
        needPrep: boolean;
    }): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
