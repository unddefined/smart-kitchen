import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<{
        name: string;
        createdAt: Date;
        id: number;
        station: string | null;
        tel: string | null;
        avatar: string | null;
        password: string | null;
    }>;
    findAll(): Promise<{
        name: string;
        createdAt: Date;
        id: number;
        station: string | null;
        tel: string | null;
        avatar: string | null;
        password: string | null;
    }[]>;
    findOne(id: string): Promise<{
        name: string;
        createdAt: Date;
        id: number;
        station: string | null;
        tel: string | null;
        avatar: string | null;
        password: string | null;
    } | null>;
    update(id: string, updateUserDto: Partial<CreateUserDto>): Promise<{
        name: string;
        createdAt: Date;
        id: number;
        station: string | null;
        tel: string | null;
        avatar: string | null;
        password: string | null;
    }>;
    remove(id: string): Promise<{
        name: string;
        createdAt: Date;
        id: number;
        station: string | null;
        tel: string | null;
        avatar: string | null;
        password: string | null;
    }>;
}
