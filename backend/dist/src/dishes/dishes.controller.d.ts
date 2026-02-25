import { DishesService } from './dishes.service';
export declare class DishesController {
    private readonly dishesService;
    constructor(dishesService: DishesService);
    create(createDishDto: any): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        recipeId: number | null;
        shortcutCode: string | null;
        stationId: number;
        categoryId: number;
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
    findOne(id: string): Promise<({
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
    update(id: string, updateDishDto: any): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        recipeId: number | null;
        shortcutCode: string | null;
        stationId: number;
        categoryId: number;
    }>;
    remove(id: string): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        recipeId: number | null;
        shortcutCode: string | null;
        stationId: number;
        categoryId: number;
    }>;
}
