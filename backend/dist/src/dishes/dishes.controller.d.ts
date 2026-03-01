import { DishesService } from './dishes.service';
export declare class DishesController {
    private readonly dishesService;
    constructor(dishesService: DishesService);
    create(createDishDto: any): Promise<{
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
    findOne(id: string): Promise<{
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
    update(id: string, updateDishDto: any): Promise<{
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
    remove(id: string): Promise<{
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
}
