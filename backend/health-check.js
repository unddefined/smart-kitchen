#!/usr/bin/env node

const DatabaseManager = require('./src/database/DatabaseManager');
const fs = require('fs').promises;
const path = require('path');

/**
 * 轻量级数据库健康检查脚本
 * 用于定期监控和快速诊断
 */

class HealthChecker {
    constructor(options = {}) {
        this.options = {
            mode: options.mode || 'quick', // quick, detailed, monitor
            interval: options.interval || 30000, // 30秒
            outputPath: options.outputPath || './reports',
            cloudMode: options.cloudMode || false,
            ...options
        };
        
        const dbConfig = this.options.cloudMode ? {
            host: '8.145.34.30',
            port: 5432,
            database: 'smart_kitchen_prod',
            user: 'smart_kitchen_user',
            password: '13814349230cX'
        } : {};
        
        this.dbManager = new DatabaseManager(dbConfig);
        this.isMonitoring = false;
        this.monitorTimer = null;
    }
    
    /**
     * 执行健康检查
     */
    async check() {
        try {
            console.log(`🏥 执行${this.options.mode}健康检查...`);
            
            let healthStatus;
            
            switch (this.options.mode) {
                case 'quick':
                    healthStatus = await this.quickCheck();
                    break;
                case 'detailed':
                    healthStatus = await this.detailedCheck();
                    break;
                case 'monitor':
                    await this.startMonitoring();
                    return;
                default:
                    throw new Error('未知的检查模式');
            }
            
            await this.handleResult(healthStatus);
            return healthStatus;
            
        } catch (error) {
            console.error('❌ 健康检查失败:', error.message);
            await this.handleResult({
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * 快速健康检查
     */
    async quickCheck() {
        const startTime = Date.now();
        
        try {
            // 基础连接测试
            const connectionTest = await this.dbManager.testConnection(2000);
            
            // 简单查询测试
            const queryResult = await this.dbManager.query('SELECT 1 as test');
            
            const latency = Date.now() - startTime;
            const poolStats = this.dbManager.getPoolStats();
            
            return {
                status: latency < 1000 ? 'healthy' : 'degraded',
                timestamp: new Date().toISOString(),
                latency: latency,
                connection: connectionTest,
                pool: {
                    total: poolStats.totalCount,
                    idle: poolStats.idleCount,
                    waiting: poolStats.waitingCount
                },
                querySuccess: queryResult.rowCount === 1
            };
            
        } catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message,
                latency: Date.now() - startTime
            };
        }
    }
    
    /**
     * 详细健康检查
     */
    async detailedCheck() {
        const basicCheck = await this.quickCheck();
        
        if (basicCheck.status === 'unhealthy') {
            return basicCheck;
        }
        
        try {
            // 获取详细统计信息
            const [tableStats, connectionStats, performanceStats] = await Promise.all([
                this.getTableStatistics(),
                this.getConnectionStatistics(),
                this.getPerformanceStatistics()
            ]);
            
            return {
                ...basicCheck,
                status: this.evaluateDetailedStatus(basicCheck.latency, tableStats, connectionStats),
                details: {
                    tables: tableStats,
                    connections: connectionStats,
                    performance: performanceStats
                }
            };
            
        } catch (error) {
            return {
                ...basicCheck,
                status: 'degraded',
                error: error.message
            };
        }
    }
    
    /**
     * 获取表统计信息
     */
    async getTableStatistics() {
        const result = await this.dbManager.query(`
            SELECT 
                COUNT(*) as total_tables,
                SUM(pg_total_relation_size('public.' || tablename)) as total_size_bytes
            FROM pg_tables 
            WHERE schemaname = 'public'
        `);
        
        const sizeBytes = parseInt(result.rows[0].total_size_bytes || 0);
        const sizeMB = Math.round(sizeBytes / (1024 * 1024));
        
        return {
            tableCount: parseInt(result.rows[0].total_tables),
            totalSizeMB: sizeMB,
            sizeFormatted: `${sizeMB} MB`
        };
    }
    
    /**
     * 获取连接统计信息
     */
    async getConnectionStatistics() {
        const result = await this.dbManager.query(`
            SELECT 
                COUNT(*) as total_connections,
                COUNT(CASE WHEN state = 'active' THEN 1 END) as active_connections,
                COUNT(CASE WHEN state = 'idle' THEN 1 END) as idle_connections
            FROM pg_stat_activity 
            WHERE datname = current_database()
        `);
        
        const row = result.rows[0];
        return {
            total: parseInt(row.total_connections),
            active: parseInt(row.active_connections),
            idle: parseInt(row.idle_connections)
        };
    }
    
    /**
     * 获取性能统计信息
     */
    async getPerformanceStatistics() {
        const poolStats = this.dbManager.getPoolStats();
        return {
            queryCount: poolStats.metrics.queryCount,
            errorCount: poolStats.metrics.errorCount,
            avgQueryTime: Math.round(poolStats.metrics.avgQueryTime),
            maxQueryTime: poolStats.metrics.maxQueryTime
        };
    }
    
    /**
     * 评估详细状态
     */
    evaluateDetailedStatus(latency, tableStats, connectionStats) {
        if (latency > 2000) return 'degraded';
        if (connectionStats.active > 50) return 'warning';
        if (tableStats.totalSizeMB > 1000) return 'warning';
        return 'healthy';
    }
    
    /**
     * 启动持续监控
     */
    async startMonitoring() {
        if (this.isMonitoring) {
            console.log('⚠️  监控已在运行中');
            return;
        }
        
        this.isMonitoring = true;
        console.log(`🔄 启动持续监控，间隔: ${this.options.interval}ms`);
        
        const performCheck = async () => {
            try {
                const result = await this.quickCheck();
                await this.handleResult(result, true);
                
                if (this.isMonitoring) {
                    this.monitorTimer = setTimeout(performCheck, this.options.interval);
                }
            } catch (error) {
                console.error('监控检查失败:', error.message);
                if (this.isMonitoring) {
                    this.monitorTimer = setTimeout(performCheck, this.options.interval);
                }
            }
        };
        
        await performCheck();
    }
    
    /**
     * 停止监控
     */
    stopMonitoring() {
        this.isMonitoring = false;
        if (this.monitorTimer) {
            clearTimeout(this.monitorTimer);
            this.monitorTimer = null;
        }
        console.log('⏹️  监控已停止');
    }
    
    /**
     * 处理检查结果
     */
    async handleResult(result, isMonitoring = false) {
        // 控制台输出
        if (!isMonitoring || result.status !== 'healthy') {
            this.printResult(result);
        }
        
        // 文件输出
        if (this.options.outputPath) {
            await this.saveResult(result);
        }
        
        // 发送通知（如果有配置）
        await this.sendNotification(result);
        
        // 根据状态采取行动
        if (result.status === 'unhealthy') {
            await this.handleUnhealthyState(result);
        }
    }
    
    /**
     * 打印结果到控制台
     */
    printResult(result) {
        const statusEmoji = {
            'healthy': '✅',
            'degraded': '⚠️',
            'warning': '⚠️',
            'unhealthy': '❌',
            'error': '💥'
        };
        
        console.log(`${statusEmoji[result.status] || '❓'} [${new Date().toLocaleTimeString()}] 状态: ${result.status.toUpperCase()}`);
        
        if (result.latency) {
            console.log(`   延迟: ${result.latency}ms`);
        }
        
        if (result.pool) {
            console.log(`   连接池: ${result.pool.total} 总计, ${result.pool.idle} 空闲, ${result.pool.waiting} 等待`);
        }
        
        if (result.error) {
            console.log(`   错误: ${result.error}`);
        }
        
        console.log('');
    }
    
    /**
     * 保存结果到文件
     */
    async saveResult(result) {
        try {
            // 确保输出目录存在
            await fs.mkdir(this.options.outputPath, { recursive: true });
            
            const fileName = `health-check-${new Date().toISOString().split('T')[0]}.log`;
            const filePath = path.join(this.options.outputPath, fileName);
            
            const logEntry = {
                timestamp: result.timestamp,
                status: result.status,
                latency: result.latency,
                ...(result.error && { error: result.error })
            };
            
            const logLine = JSON.stringify(logEntry) + '\n';
            await fs.appendFile(filePath, logLine);
            
        } catch (error) {
            console.error('保存检查结果失败:', error.message);
        }
    }
    
    /**
     * 发送通知
     */
    async sendNotification(result) {
        // 这里可以集成邮件、短信、Slack等通知服务
        if (result.status === 'unhealthy' || result.status === 'error') {
            console.log('🚨 检测到严重问题，需要发送告警通知');
            // 实际实现中这里会调用通知服务API
        }
    }
    
    /**
     * 处理不健康状态
     */
    async handleUnhealthyState(result) {
        console.log('🚑 执行应急处理程序...');
        // 可以在这里添加自动恢复逻辑
        // 例如：重启连接池、切换到备用数据库等
    }
    
    /**
     * 关闭健康检查器
     */
    async close() {
        this.stopMonitoring();
        await this.dbManager.close();
        console.log('🏥 健康检查器已关闭');
    }
}

// 命令行接口
async function main() {
    const args = process.argv.slice(2);
    const options = {};
    
    // 解析命令行参数
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--mode':
                options.mode = args[++i];
                break;
            case '--interval':
                options.interval = parseInt(args[++i]);
                break;
            case '--cloud':
                options.cloudMode = true;
                break;
            case '--output':
                options.outputPath = args[++i];
                break;
            case '--help':
                console.log(`
数据库健康检查工具

用法: node health-check.js [选项]

选项:
  --mode <模式>      检查模式: quick(快速), detailed(详细), monitor(监控)
  --interval <毫秒>  监控间隔时间 (默认: 30000)
  --cloud           使用云数据库配置
  --output <路径>    输出文件路径
  --help            显示帮助信息

示例:
  node health-check.js --mode quick
  node health-check.js --mode monitor --interval 10000
  node health-check.js --mode detailed --cloud
                `);
                process.exit(0);
        }
    }
    
    const checker = new HealthChecker(options);
    
    try {
        await checker.check();
    } catch (error) {
        console.error('检查执行失败:', error.message);
        process.exit(1);
    } finally {
        if (options.mode !== 'monitor') {
            await checker.close();
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = HealthChecker;