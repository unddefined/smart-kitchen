"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    try {
        await prisma.$connect();
        console.log('✅ 数据库连接成功！');
        const userCount = await prisma.user.count();
        console.log(`📊 当前用户数量: ${userCount}`);
        const stationCount = await prisma.station.count();
        console.log(`📊 当前工位数量: ${stationCount}`);
        const dishCount = await prisma.dish.count();
        console.log(`📊 当前菜品数量: ${dishCount}`);
    }
    catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=test-connection.js.map