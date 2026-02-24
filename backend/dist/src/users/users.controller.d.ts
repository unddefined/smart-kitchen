import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<{
        station: string | null;
        name: string;
        tel: string | null;
        avatar: string | null;
        password: string | null;
        createdAt: Date;
        id: number;
    }>;
    findAll(): Promise<{
        station: string | null;
        name: string;
        tel: string | null;
        avatar: string | null;
        password: string | null;
        createdAt: Date;
        id: number;
    }[]>;
    findOne(id: string): Promise<{
        station: string | null;
        name: string;
        tel: string | null;
        avatar: string | null;
        password: string | null;
        createdAt: Date;
        id: number;
    } | null>;
    update(id: string, updateUserDto: Partial<CreateUserDto>): Promise<{
        station: string | null;
        name: string;
        tel: string | null;
        avatar: string | null;
        password: string | null;
        createdAt: Date;
        id: number;
    }>;
    remove(id: string): Promise<{
        station: string | null;
        name: string;
        tel: string | null;
        avatar: string | null;
        password: string | null;
        createdAt: Date;
        id: number;
    }>;
}
