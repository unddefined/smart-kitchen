import { MockDataService } from './mock-data.service';
export declare class TestController {
    private readonly mockDataService;
    constructor(mockDataService: MockDataService);
    getDishes(): {
        success: boolean;
        data: {
            id: number;
            name: string;
            category: string;
            price: number;
            description: string;
            available: boolean;
        }[];
        message: string;
    };
    getOrders(): {
        success: boolean;
        data: {
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
        message: string;
    };
    getAlerts(): {
        success: boolean;
        data: {
            id: number;
            type: string;
            message: string;
            priority: number;
            createdAt: Date;
        }[];
        message: string;
    };
    getTestHealth(): {
        success: boolean;
        message: string;
        timestamp: string;
    };
}
