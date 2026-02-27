import { DishesService } from './dishes.service';
export declare class DishesController {
    private readonly dishesService;
    constructor(dishesService: DishesService);
    create(createDishDto: any): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        stationId: number;
        categoryId: number;
        shortcutCode: string;
        recipeId: number;
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
            description: string;
            displayOrder: number;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        stationId: number;
        categoryId: number;
        shortcutCode: string;
        recipeId: number;
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
            description: string;
            displayOrder: number;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        stationId: number;
        categoryId: number;
        shortcutCode: string;
        recipeId: number;
    }>;
    update(id: string, updateDishDto: any): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        stationId: number;
        categoryId: number;
        shortcutCode: string;
        recipeId: number;
    }>;
    remove(id: string): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        stationId: number;
        categoryId: number;
        shortcutCode: string;
        recipeId: number;
    }>;
}
