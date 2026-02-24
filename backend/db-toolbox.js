#!/usr/bin/env node

require('dotenv').config({ path: './.env' });
const DatabaseManager = require('./src/database/DatabaseManager');
const DatabaseDiagnostic = require('./src/database/DatabaseDiagnostic');
const readline = require('readline');

/**
 * 数据库工具箱 - 统一入口
 * 集成了连接管理、诊断、监控等功能
 */

class DatabaseToolbox {
    constructor() {
        this.dbManager = null;
        this.diagnostic = null;
        this.currentConfig = 'cloud'; // 默认使用云数据库
    }
    
    /**
     * 显示主菜单
     */
    async showMainMenu() {
        console.log('\n' + '='.repeat(50));
        console.log('🔧 智能厨房系统数据库工具箱');
        console.log('='.repeat(50));
        console.log(`当前配置: ${this.currentConfig === 'cloud' ? '☁️  云数据库' : '🏠 本地数据库'}`);
        console.log('');
        console.log('请选择功能:');
        console.log('1. 🔧 数据库连接测试');
        console.log('2. 🏥 健康检查');
        console.log('3. 🔍 详细诊断');
        console.log('4. 📊 性能监控');
        console.log('5. ⚙️  配置管理');
        console.log('6. 📈 生成报告');
        console.log('7. 🚪 退出');
        console.log('');
    }
    
    /**
     * 处理用户选择
     */
    async handleChoice(choice) {
        switch (choice.trim()) {
            case '1':
                await this.runConnectionTest();
                break;
            case '2':
                await this.runHealthCheck();
                break;
            case '3':
                await this.runDiagnostic();
                break;
            case '4':
                await this.runPerformanceMonitor();
                break;
            case '5':
                await this.manageConfiguration();
                break;
            case '6':
                await this.generateReport();
                break;
            case '7':
                console.log('👋 再见！');
                return false;
            default:
                console.log('❌ 无效选择，请重新输入');
        }
        return true;
    }
    
    /**
     * 运行连接测试
     */
    async runConnectionTest() {
        console.log('\n🔧 执行数据库连接测试...\n');
        
        try {
            const manager = this.getDatabaseManager();
            const result = await manager.testConnection();
            
            console.log('✅ 连接测试结果:');
            console.log(`   状态: 成功`);
            console.log(`   延迟: ${result.latency}ms`);
            console.log(`   数据库: ${result.database}`);
            console.log(`   用户: ${result.user}`);
            console.log(`   版本: ${result.version.split(' ')[0]} ${result.version.split(' ')[1]}`);
            
        } catch (error) {
            console.log('❌ 连接测试失败:');
            console.log(`   错误: ${error.message}`);
            console.log('\n💡 建议检查:');
            console.log('   • 网络连接到云服务器');
            console.log('   • 云数据库服务状态');
            console.log('   • 防火墙配置');
        }
    }
    
    /**
     * 运行健康检查
     */
    async runHealthCheck() {
        console.log('\n🏥 执行健康检查...\n');
        
        try {
            const manager = this.getDatabaseManager();
            const healthStatus = await manager.healthCheck(true);
            
            console.log('📊 健康检查结果:');
            console.log(`   状态: ${healthStatus.status.toUpperCase()}`);
            console.log(`   延迟: ${healthStatus.connection.latency}ms`);
            console.log(`   连接池: ${healthStatus.pool.total} 总计, ${healthStatus.pool.idle} 空闲`);
            
            if (healthStatus.details) {
                console.log(`   表数量: ${healthStatus.details.tableCount}`);
                console.log(`   数据库大小: ${healthStatus.details.databaseSize}`);
                console.log(`   活跃连接: ${healthStatus.details.activeConnections}`);
            }
            
        } catch (error) {
            console.log('❌ 健康检查失败:');
            console.log(`   错误: ${error.message}`);
        }
    }
    
    /**
     * 运行详细诊断
     */
    async runDiagnostic() {
        console.log('\n🔍 执行详细诊断...\n');
        
        try {
            this.diagnostic = new DatabaseDiagnostic(
                this.currentConfig === 'cloud' ? {
                    host: '8.145.34.30',
                    port: 5432,
                    database: 'smart_kitchen_prod',
                    user: 'smart_kitchen_user',
                    password: '13814349230cX'
                } : {}
            );
            
            const report = await this.diagnostic.runFullDiagnostics();
            
            console.log('\n📋 诊断完成，结果已显示在上方');
            
            // 询问是否保存报告
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            rl.question('\n是否保存详细报告到文件? (y/N): ', async (answer) => {
                if (answer.toLowerCase() === 'y') {
                    try {
                        const result = await this.diagnostic.generateReport('file');
                        console.log(`✅ 报告已保存到: ${result.filePath}`);
                    } catch (saveError) {
                        console.log(`❌ 保存报告失败: ${saveError.message}`);
                    }
                }
                rl.close();
                await this.showMainMenu();
            });
            
        } catch (error) {
            console.log('❌ 诊断执行失败:');
            console.log(`   错误: ${error.message}`);
        }
    }
    
    /**
     * 运行性能监控
     */
    async runPerformanceMonitor() {
        console.log('\n📊 启动性能监控...\n');
        console.log('监控模式:');
        console.log('1. 快速检查 (一次性)');
        console.log('2. 持续监控 (每30秒)');
        console.log('3. 返回主菜单');
        console.log('');
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question('请选择模式 (1-3): ', async (choice) => {
            try {
                switch (choice.trim()) {
                    case '1':
                        await this.runQuickMonitor();
                        break;
                    case '2':
                        await this.startContinuousMonitor(rl);
                        return; // 不返回主菜单，继续监控
                    case '3':
                        break;
                    default:
                        console.log('❌ 无效选择');
                }
            } catch (error) {
                console.log(`❌ 监控执行失败: ${error.message}`);
            } finally {
                if (choice.trim() !== '2') {
                    rl.close();
                    await this.showMainMenu();
                }
            }
        });
    }
    
    /**
     * 快速监控
     */
    async runQuickMonitor() {
        const manager = this.getDatabaseManager();
        const startTime = Date.now();
        
        // 执行多个查询测试性能
        const queries = [
            'SELECT 1',
            'SELECT version(), current_database()',
            'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = \'public\'',
            'SELECT COUNT(*) FROM dishes',
            'SELECT COUNT(*) FROM stations'
        ];
        
        console.log('⏱️  执行性能基准测试...\n');
        
        for (let i = 0; i < queries.length; i++) {
            const queryStart = Date.now();
            try {
                await manager.query(queries[i]);
                const duration = Date.now() - queryStart;
                console.log(`✅ 查询 ${i + 1}: ${duration}ms`);
            } catch (error) {
                const duration = Date.now() - queryStart;
                console.log(`❌ 查询 ${i + 1}: ${duration}ms (失败: ${error.message})`);
            }
        }
        
        const totalTime = Date.now() - startTime;
        console.log(`\n📈 总执行时间: ${totalTime}ms`);
    }
    
    /**
     * 启动持续监控
     */
    async startContinuousMonitor(rl) {
        console.log('🔄 启动持续监控 (按 Ctrl+C 停止)...');
        console.log('');
        
        const manager = this.getDatabaseManager();
        let checkCount = 0;
        
        const performCheck = async () => {
            try {
                checkCount++;
                const health = await manager.healthCheck();
                const timestamp = new Date().toLocaleTimeString();
                
                const statusIcon = health.status === 'healthy' ? '✅' : '⚠️';
                console.log(`${statusIcon} [${timestamp}] 检查 #${checkCount}: ${health.status.toUpperCase()} (${health.connection.latency}ms)`);
                
                // 每10次检查显示一次详细信息
                if (checkCount % 10 === 0) {
                    const poolStats = manager.getPoolStats();
                    console.log(`   连接池状态: ${poolStats.totalCount} 总计, ${poolStats.idleCount} 空闲, ${poolStats.waitingCount} 等待`);
                }
                
            } catch (error) {
                console.log(`❌ [${new Date().toLocaleTimeString()}] 检查失败: ${error.message}`);
            }
        };
        
        // 立即执行第一次检查
        await performCheck();
        
        // 设置定时检查
        const interval = setInterval(performCheck, 30000);
        
        // 监听 Ctrl+C
        process.on('SIGINT', () => {
            clearInterval(interval);
            console.log('\n⏹️  监控已停止');
            rl.close();
            this.showMainMenu().catch(console.error);
        });
    }
    
    /**
     * 管理配置
     */
    async manageConfiguration() {
        console.log('\n⚙️  配置管理');
        console.log('当前配置:', this.currentConfig === 'cloud' ? '☁️  云数据库' : '🏠 本地数据库');
        console.log('');
        console.log('1. 切换到云数据库');
        console.log('2. 切换到本地数据库');
        console.log('3. 查看当前配置详情');
        console.log('4. 返回主菜单');
        console.log('');
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question('请选择操作 (1-4): ', async (choice) => {
            try {
                switch (choice.trim()) {
                    case '1':
                        this.currentConfig = 'cloud';
                        console.log('✅ 已切换到云数据库配置');
                        break;
                    case '2':
                        this.currentConfig = 'local';
                        console.log('✅ 已切换到本地数据库配置');
                        break;
                    case '3':
                        this.showConfigDetails();
                        break;
                    case '4':
                        break;
                    default:
                        console.log('❌ 无效选择');
                }
            } finally {
                rl.close();
                await this.showMainMenu();
            }
        });
    }
    
    /**
     * 显示配置详情
     */
    showConfigDetails() {
        if (this.currentConfig === 'cloud') {
            console.log('\n☁️  云数据库配置:');
            console.log('   主机: 8.145.34.30');
            console.log('   端口: 5432');
            console.log('   数据库: smart_kitchen_prod');
            console.log('   用户: smart_kitchen_user');
        } else {
            console.log('\n🏠 本地数据库配置:');
            console.log('   主机: localhost');
            console.log('   端口: 5432');
            console.log('   数据库: smart_kitchen_dev');
            console.log('   用户: postgres');
        }
        console.log('');
    }
    
    /**
     * 生成报告
     */
    async generateReport() {
        console.log('\n📈 生成数据库报告...\n');
        
        try {
            const manager = this.getDatabaseManager();
            const health = await manager.healthCheck(true);
            const poolStats = manager.getPoolStats();
            
            console.log('📊 数据库状态报告');
            console.log('==================');
            console.log(`生成时间: ${new Date().toLocaleString()}`);
            console.log(`配置模式: ${this.currentConfig === 'cloud' ? '云数据库' : '本地数据库'}`);
            console.log('');
            console.log('连接状态:');
            console.log(`  状态: ${health.status.toUpperCase()}`);
            console.log(`  延迟: ${health.connection.latency}ms`);
            console.log(`  数据库: ${health.connection.database}`);
            console.log(`  用户: ${health.connection.user}`);
            console.log('');
            console.log('连接池统计:');
            console.log(`  总连接数: ${poolStats.totalCount}`);
            console.log(`  空闲连接: ${poolStats.idleCount}`);
            console.log(`  等待连接: ${poolStats.waitingCount}`);
            console.log(`  总查询数: ${poolStats.metrics.queryCount}`);
            console.log(`  错误次数: ${poolStats.metrics.errorCount}`);
            console.log(`  平均查询时间: ${Math.round(poolStats.metrics.avgQueryTime)}ms`);
            
            if (health.details) {
                console.log('');
                console.log('数据库详情:');
                console.log(`  表数量: ${health.details.tableCount}`);
                console.log(`  数据库大小: ${health.details.databaseSize}`);
                console.log(`  活跃连接: ${health.details.activeConnections}`);
            }
            
        } catch (error) {
            console.log('❌ 报告生成失败:');
            console.log(`   错误: ${error.message}`);
        }
    }
    
    /**
     * 获取数据库管理器实例
     */
    getDatabaseManager() {
        if (!this.dbManager) {
            const config = this.currentConfig === 'cloud' ? {
                host: '8.145.34.30',
                port: 5432,
                database: 'smart_kitchen_prod',
                user: 'smart_kitchen_user',
                password: '13814349230cX'
            } : {
                // 本地配置（如果需要的话）
                host: 'localhost',
                port: 5432,
                database: 'smart_kitchen_dev',
                user: 'postgres',
                password: process.env.DATABASE_URL ? 
                    process.env.DATABASE_URL.split(':')[2].split('@')[0] : 'postgres'
            };
            
            this.dbManager = new DatabaseManager(config);
        }
        return this.dbManager;
    }
    
    /**
     * 启动工具箱
     */
    async start() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        let continueRunning = true;
        
        while (continueRunning) {
            await this.showMainMenu();
            const choice = await this.getUserInput(rl, '请输入选择 (1-7): ');
            continueRunning = await this.handleChoice(choice);
        }
        
        rl.close();
        if (this.dbManager) {
            await this.dbManager.close();
        }
        if (this.diagnostic) {
            await this.diagnostic.close();
        }
    }
    
    /**
     * 获取用户输入
     */
    getUserInput(rl, prompt) {
        return new Promise((resolve) => {
            rl.question(prompt, (answer) => {
                resolve(answer);
            });
        });
    }
}

// 命令行接口
async function main() {
    // 检查命令行参数
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
        // 直接执行特定功能
        const toolbox = new DatabaseToolbox();
        
        switch (args[0]) {
            case 'test':
                await toolbox.runConnectionTest();
                break;
            case 'health':
                await toolbox.runHealthCheck();
                break;
            case 'diagnose':
                await toolbox.runDiagnostic();
                break;
            case 'monitor':
                // 这里可以添加命令行监控模式
                console.log('监控模式请使用交互式界面');
                break;
            case 'help':
                console.log(`
数据库工具箱使用说明

用法: node db-toolbox.js [命令]

命令:
  test      执行连接测试
  health    执行健康检查
  diagnose  执行详细诊断
  help      显示此帮助信息

交互式模式: 直接运行 node db-toolbox.js

示例:
  node db-toolbox.js test
  node db-toolbox.js health
  node db-toolbox.js diagnose
                `);
                break;
            default:
                console.log('❌ 未知命令，使用 "help" 查看帮助');
        }
        
        if (toolbox.dbManager) {
            await toolbox.dbManager.close();
        }
        return;
    }
    
    // 启动交互式界面
    const toolbox = new DatabaseToolbox();
    await toolbox.start();
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 工具箱运行出错:', error.message);
        process.exit(1);
    });
}

module.exports = DatabaseToolbox;