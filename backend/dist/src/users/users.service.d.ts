import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
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
    findOne(id: number): Promise<{
        station: string | null;
        name: string;
        tel: string | null;
        avatar: string | null;
        password: string | null;
        createdAt: Date;
        id: number;
    } | null>;
    findByTel(tel: string): Promise<{
        station: string | null;
        name: string;
        tel: string | null;
        avatar: string | null;
        password: string | null;
        createdAt: Date;
        id: number;
    } | null>;
    update(id: number, updateUserDto: Partial<CreateUserDto>): Promise<{
        station: string | null;
        name: string;
        tel: string | null;
        avatar: string | null;
        password: string | null;
        createdAt: Date;
        id: number;
    }>;
    remove(id: number): Promise<{
        station: string | null;
        name: string;
        tel: string | null;
        avatar: string | null;
        password: string | null;
        createdAt: Date;
        id: number;
    }>;
}
