import { DishesService } from './dishes.service';
export declare class DishesController {
    private readonly dishesService;
    constructor(dishesService: DishesService);
    create(createDishDto: any): Promise<{
        name: string;
        createdAt: Date;
        id: number;
        shortcutCode: string | null;
        recipeId: number | null;
        stationId: number;
        categoryId: number;
    }>;
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
    findOne(id: string): Promise<({
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
    }) | null>;
    update(id: string, updateDishDto: any): Promise<{
        name: string;
        createdAt: Date;
        id: number;
        shortcutCode: string | null;
        recipeId: number | null;
        stationId: number;
        categoryId: number;
    }>;
    remove(id: string): Promise<{
        name: string;
        createdAt: Date;
        id: number;
        shortcutCode: string | null;
        recipeId: number | null;
        stationId: number;
        categoryId: number;
    }>;
}
