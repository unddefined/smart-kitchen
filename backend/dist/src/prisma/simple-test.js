"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
async function testConnection() {
    var _a, _b, _c;
    console.log('🔧 测试数据库连接...\n');
    const prisma = new client_1.PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
    });
    try {
        await prisma.$connect();
        console.log('✅ 数据库连接成功！\n');
        console.log('🧪 执行基础查询测试...');
        const versionResult = await prisma.$queryRaw `SELECT version() as version`;
        console.log('PostgreSQL版本:', (_a = versionResult[0]) === null || _a === void 0 ? void 0 : _a.version);
        const dbResult = await prisma.$queryRaw `SELECT current_database() as db_name`;
        console.log('当前数据库:', (_b = dbResult[0]) === null || _b === void 0 ? void 0 : _b.db_name);
        const userResult = await prisma.$queryRaw `SELECT current_user as username`;
        console.log('当前用户:', (_c = userResult[0]) === null || _c === void 0 ? void 0 : _c.username);
        console.log('\n✅ 所有测试通过！');
    }
    catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        console.log('\n请检查:');
        console.log('  1. 数据库服务是否运行');
        console.log('  2. 环境变量DATABASE_URL配置是否正确');
        console.log('  3. 网络连接是否正常');
    }
    finally {
        await prisma.$disconnect();
    }
}
testConnection();
//# sourceMappingURL=simple-test.js.map