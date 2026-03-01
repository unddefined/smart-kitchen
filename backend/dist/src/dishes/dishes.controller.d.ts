import { DishesService } from './dishes.service';
export declare class DishesController {
    private readonly dishesService;
    constructor(dishesService: DishesService);
    findAll(): Promise<({
        station: {
            createdAt: Date;
            id: number;
            name: string;
        };
        category: {
            createdAt: Date;
            id: number;
            name: string;
            description: string | null;
            displayOrder: number;
        };
    } & {
        createdAt: Date;
        id: number;
        name: string;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        needPrep: boolean;
        isActive: boolean;
    })[]>;
    findOne(id: string): Promise<{
        station: {
            createdAt: Date;
            id: number;
            name: string;
        };
        category: {
            createdAt: Date;
            id: number;
            name: string;
            description: string | null;
            displayOrder: number;
        };
    } & {
        createdAt: Date;
        id: number;
        name: string;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        needPrep: boolean;
        isActive: boolean;
    }>;
    findByCategory(categoryId: string): Promise<({
        station: {
            createdAt: Date;
            id: number;
            name: string;
        };
        category: {
            createdAt: Date;
            id: number;
            name: string;
            description: string | null;
            displayOrder: number;
        };
    } & {
        createdAt: Date;
        id: number;
        name: string;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        needPrep: boolean;
        isActive: boolean;
    })[]>;
    findByStation(stationId: string): Promise<({
        station: {
            createdAt: Date;
            id: number;
            name: string;
        };
        category: {
            createdAt: Date;
            id: number;
            name: string;
            description: string | null;
            displayOrder: number;
        };
    } & {
        createdAt: Date;
        id: number;
        name: string;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        needPrep: boolean;
        isActive: boolean;
    })[]>;
    searchByName(name: string): Promise<({
        station: {
            createdAt: Date;
            id: number;
            name: string;
        };
        category: {
            createdAt: Date;
            id: number;
            name: string;
            description: string | null;
            displayOrder: number;
        };
    } & {
        createdAt: Date;
        id: number;
        name: string;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        needPrep: boolean;
        isActive: boolean;
    })[]>;
    findByPrepRequirement(needPrep: string): Promise<({
        station: {
            createdAt: Date;
            id: number;
            name: string;
        };
        category: {
            createdAt: Date;
            id: number;
            name: string;
            description: string | null;
            displayOrder: number;
        };
    } & {
        createdAt: Date;
        id: number;
        name: string;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        needPrep: boolean;
        isActive: boolean;
    })[]>;
    getCategoriesInServingOrder(): Promise<{
        createdAt: Date;
        id: number;
        name: string;
        description: string | null;
        displayOrder: number;
    }[]>;
    getDishesGroupedByCategory(): Promise<any[]>;
    create(createDishDto: any): Promise<{
        station: {
            createdAt: Date;
            id: number;
            name: string;
        };
        category: {
            createdAt: Date;
            id: number;
            name: string;
            description: string | null;
            displayOrder: number;
        };
    } & {
        createdAt: Date;
        id: number;
        name: string;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        needPrep: boolean;
        isActive: boolean;
    }>;
    update(id: string, updateDishDto: any): Promise<{
        station: {
            createdAt: Date;
            id: number;
            name: string;
        };
        category: {
            createdAt: Date;
            id: number;
            name: string;
            description: string | null;
            displayOrder: number;
        };
    } & {
        createdAt: Date;
        id: number;
        name: string;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        needPrep: boolean;
        isActive: boolean;
    }>;
    remove(id: string): Promise<{
        createdAt: Date;
        id: number;
        name: string;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
        recipeId: number | null;
        countable: boolean;
        needPrep: boolean;
        isActive: boolean;
    }>;
    batchUpdatePrepRequirement(body: {
        dishIds: number[];
        needPrep: boolean;
    }): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
