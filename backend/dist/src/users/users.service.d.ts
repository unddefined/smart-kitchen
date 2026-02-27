import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
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
    findOne(id: number): Promise<{
        name: string;
        createdAt: Date;
        id: number;
        station: string | null;
        tel: string | null;
        avatar: string | null;
        password: string | null;
    }>;
    findByTel(tel: string): Promise<{
        name: string;
        createdAt: Date;
        id: number;
        station: string | null;
        tel: string | null;
        avatar: string | null;
        password: string | null;
    }>;
    update(id: number, updateUserDto: Partial<CreateUserDto>): Promise<{
        name: string;
        createdAt: Date;
        id: number;
        station: string | null;
        tel: string | null;
        avatar: string | null;
        password: string | null;
    }>;
    remove(id: number): Promise<{
        name: string;
        createdAt: Date;
        id: number;
        station: string | null;
        tel: string | null;
        avatar: string | null;
        password: string | null;
    }>;
}
