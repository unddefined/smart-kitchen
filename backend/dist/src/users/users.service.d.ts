import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
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
    findOne(id: number): Promise<{
        station: string;
        id: number;
        name: string;
        createdAt: Date;
        tel: string;
        avatar: string;
        password: string;
    }>;
    findByTel(tel: string): Promise<{
        station: string;
        id: number;
        name: string;
        createdAt: Date;
        tel: string;
        avatar: string;
        password: string;
    }>;
    update(id: number, updateUserDto: Partial<CreateUserDto>): Promise<{
        station: string;
        id: number;
        name: string;
        createdAt: Date;
        tel: string;
        avatar: string;
        password: string;
    }>;
    remove(id: number): Promise<{
        station: string;
        id: number;
        name: string;
        createdAt: Date;
        tel: string;
        avatar: string;
        password: string;
    }>;
}
