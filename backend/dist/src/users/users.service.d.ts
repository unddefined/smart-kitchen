import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
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
    findOne(id: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        station: string | null;
        tel: string | null;
        avatar: string | null;
        password: string | null;
    } | null>;
    findByTel(tel: string): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        station: string | null;
        tel: string | null;
        avatar: string | null;
        password: string | null;
    } | null>;
    update(id: number, updateUserDto: Partial<CreateUserDto>): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        station: string | null;
        tel: string | null;
        avatar: string | null;
        password: string | null;
    }>;
    remove(id: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        station: string | null;
        tel: string | null;
        avatar: string | null;
        password: string | null;
    }>;
}
