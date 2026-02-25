export declare class MockDataService {
    private dishes;
    private orders;
    getDishes(): {
        id: number;
        name: string;
        category: string;
        price: number;
        description: string;
        available: boolean;
    }[];
    getOrders(): {
        id: number;
        hallNumber: string;
        peopleCount: number;
        tableCount: number;
        status: string;
        createdAt: Date;
        items: {
            dishId: number;
            quantity: number;
            status: string;
        }[];
    }[];
    getServingAlerts(): {
        id: number;
        type: string;
        message: string;
        priority: number;
        createdAt: Date;
    }[];
}
