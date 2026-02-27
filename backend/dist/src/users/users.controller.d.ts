import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<{
        station: string;
        id: number;
        name: string;
        createdAt: Date;
        tel: string;
        avatar: string;
        password: string;
    }>;
    findAll(): Promise<{
        station: string;
        id: number;
        name: string;
        createdAt: Date;
        tel: string;
        avatar: string;
        password: string;
    }[]>;
    findOne(id: string): Promise<{
        station: string;
        id: number;
        name: string;
        createdAt: Date;
        tel: string;
        avatar: string;
        password: string;
    }>;
    update(id: string, updateUserDto: Partial<CreateUserDto>): Promise<{
        station: string;
        id: number;
        name: string;
        createdAt: Date;
        tel: string;
        avatar: string;
        password: string;
    }>;
    remove(id: string): Promise<{
        station: string;
        id: number;
        name: string;
        createdAt: Date;
        tel: string;
        avatar: string;
        password: string;
    }>;
}
