import { DishesService } from './dishes.service';
export declare class DishesController {
    private readonly dishesService;
    constructor(dishesService: DishesService);
    create(createDishDto: any): Promise<{
        recipe: string | null;
        name: string;
        createdAt: Date;
        id: number;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
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
        recipe: string | null;
        name: string;
        createdAt: Date;
        id: number;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
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
        recipe: string | null;
        name: string;
        createdAt: Date;
        id: number;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
    }) | null>;
    update(id: string, updateDishDto: any): Promise<{
        recipe: string | null;
        name: string;
        createdAt: Date;
        id: number;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
    }>;
    remove(id: string): Promise<{
        recipe: string | null;
        name: string;
        createdAt: Date;
        id: number;
        stationId: number;
        categoryId: number;
        shortcutCode: string | null;
    }>;
}
