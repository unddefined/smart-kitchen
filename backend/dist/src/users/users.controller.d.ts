import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        station: string | null;
        tel: string | null;
        avatar: string | null;
        password: string | null;
    }>;
    findAll(): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        station: string | null;
        tel: string | null;
        avatar: string | null;
        password: string | null;
    }[]>;
    findOne(id: string): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        station: string | null;
        tel: string | null;
        avatar: string | null;
        password: string | null;
    }>;
    update(id: string, updateUserDto: Partial<CreateUserDto>): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        station: string | null;
        tel: string | null;
        avatar: string | null;
        password: string | null;
    }>;
    remove(id: string): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        station: string | null;
        tel: string | null;
        avatar: string | null;
        password: string | null;
    }>;
}
