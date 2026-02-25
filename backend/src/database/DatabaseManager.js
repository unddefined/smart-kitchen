const { Pool, Client } = require('pg');
const EventEmitter = require('events');

/**
 * 数据库连接管理器
 * 实现连接池、健康检查、故障转移等功能
 */
class DatabaseManager extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // 默认配置
        this.defaultConfig = {
            host: 'localhost',
            port: 5432,
            database: 'smart_kitchen_prod',
            user: 'smart_kitchen',
            password: '13814349230cX',
            // 连接池配置
            max: 20,
            min: 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
            // 重试配置
            maxRetries: 3,
            retryDelay: 1000,
        };
        
        // 云数据库配置
        this.cloudConfig = {
            host: '8.145.34.30',
            port: 5432,
            database: 'smart_kitchen_prod',
            user: 'smart_kitchen',
            password: '13814349230cX',
            max: 10,
            min: 2,
            idleTimeoutMillis: 60000,
            connectionTimeoutMillis: 5000,
        };
        
        // 当前使用的配置
        this.config = { ...this.defaultConfig, ...config };
        
        // 连接池实例
        this.pool = null;
        
        // 连接状态
        this.isConnected = false;
        this.isHealthy = false;
        this.lastHealthCheck = null;
        
        // 性能监控
        this.metrics = {
            totalConnections: 0,
            activeConnections: 0,
            idleConnections: 0,
            queryCount: 0,
            errorCount: 0,
            avgQueryTime: 0,
            maxQueryTime: 0,
        };
        
        // 初始化连接池
        this.initializePool();
    }
    
    /**
     * 初始化连接池
     */
    initializePool() {
        try {
            this.pool = new Pool(this.config);
            
            // 监听连接池事件
            this.pool.on('connect', (client) => {
                this.metrics.totalConnections++;
                this.emit('pool:connect', { clientId: client.processID });
            });
            
            this.pool.on('acquire', (client) => {
                this.metrics.activeConnections++;
                this.emit('pool:acquire', { clientId: client.processID });
            });
            
            this.pool.on('remove', (client) => {
                this.metrics.activeConnections--;
                this.metrics.idleConnections--;
                this.emit('pool:remove', { clientId: client.processID });
            });
            
            this.pool.on('error', (err, client) => {
                this.metrics.errorCount++;
                this.emit('pool:error', { error: err, clientId: client?.processID });
                console.error('数据库连接池错误:', err);
            });
            
            console.log('✅ 数据库连接池初始化完成');
        } catch (error) {
            console.error('❌ 连接池初始化失败:', error.message);
            throw error;
        }
    }
    
    /**
     * 测试数据库连接
     */
    async testConnection(timeout = 5000) {
        const client = new Client(this.config);
        const startTime = Date.now();
        
        try {
            await Promise.race([
                client.connect(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('连接超时')), timeout)
                )
            ]);
            
            const result = await client.query('SELECT version(), current_database(), current_user');
            const endTime = Date.now();
            
            const connectionInfo = {
                success: true,
                latency: endTime - startTime,
                version: result.rows[0].version,
                database: result.rows[0].current_database,
                user: result.rows[0].current_user,
                timestamp: new Date().toISOString()
            };
            
            this.emit('connection:test', connectionInfo);
            return connectionInfo;
            
        } catch (error) {
            const connectionInfo = {
                success: false,
                error: error.message,
                latency: Date.now() - startTime,
                timestamp: new Date().toISOString()
            };
            
            this.emit('connection:test', connectionInfo);
            throw error;
        } finally {
            await client.end();
        }
    }
    
    /**
     * 健康检查
     */
    async healthCheck(detailed = false) {
        const startTime = Date.now();
        this.lastHealthCheck = new Date();
        
        try {
            // 基础连通性测试
            const connectionTest = await this.testConnection(3000);
            
            const healthStatus = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                connection: connectionTest,
                pool: {
                    total: this.pool ? this.pool.totalCount : 0,
                    idle: this.pool ? this.pool.idleCount : 0,
                    waiting: this.pool ? this.pool.waitingCount : 0
                },
                metrics: { ...this.metrics }
            };
            
            // 详细健康检查
            if (detailed) {
                try {
                    const client = await this.pool.connect();
                    try {
                        // 检查表状态
                        const tableStats = await client.query(`
                            SELECT 
                                COUNT(*) as table_count,
                                pg_size_pretty(pg_database_size(current_database())) as db_size
                            FROM information_schema.tables 
                            WHERE table_schema = 'public'
                        `);
                        
                        // 检查活跃连接
                        const activeConnections = await client.query(`
                            SELECT COUNT(*) as active_connections
                            FROM pg_stat_activity 
                            WHERE datname = current_database() 
                            AND state = 'active'
                        `);
                        
                        healthStatus.details = {
                            tableCount: parseInt(tableStats.rows[0].table_count),
                            databaseSize: tableStats.rows[0].db_size,
                            activeConnections: parseInt(activeConnections.rows[0].active_connections)
                        };
                    } finally {
                        client.release();
                    }
                } catch (detailError) {
                    healthStatus.details = { error: detailError.message };
                    healthStatus.status = 'degraded';
                }
            }
            
            this.isHealthy = healthStatus.status === 'healthy';
            return healthStatus;
            
        } catch (error) {
            this.isHealthy = false;
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message,
                latency: Date.now() - startTime
            };
        }
    }
    
    /**
     * 执行查询（带性能监控）
     */
    async query(text, params = []) {
        if (!this.pool) {
            throw new Error('数据库连接池未初始化');
        }
        
        const startTime = Date.now();
        this.metrics.queryCount++;
        
        try {
            const result = await this.pool.query(text, params);
            const queryTime = Date.now() - startTime;
            
            // 更新性能指标
            this.metrics.avgQueryTime = ((this.metrics.avgQueryTime * (this.metrics.queryCount - 1)) + queryTime) / this.metrics.queryCount;
            if (queryTime > this.metrics.maxQueryTime) {
                this.metrics.maxQueryTime = queryTime;
            }
            
            this.emit('query:success', { 
                query: text.substring(0, 100) + '...', 
                time: queryTime, 
                rows: result.rowCount 
            });
            
            return result;
            
        } catch (error) {
            this.metrics.errorCount++;
            const queryTime = Date.now() - startTime;
            
            this.emit('query:error', { 
                query: text.substring(0, 100) + '...', 
                error: error.message, 
                time: queryTime 
            });
            
            throw error;
        }
    }
    
    /**
     * 获取连接池统计信息
     */
    getPoolStats() {
        if (!this.pool) return null;
        
        return {
            totalCount: this.pool.totalCount,
            idleCount: this.pool.idleCount,
            waitingCount: this.pool.waitingCount,
            metrics: { ...this.metrics },
            isHealthy: this.isHealthy,
            lastHealthCheck: this.lastHealthCheck
        };
    }
    
    /**
     * 清理连接池
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            this.isConnected = false;
            this.isHealthy = false;
            this.emit('pool:closed');
            console.log('✅ 数据库连接池已关闭');
        }
    }
    
    /**
     * 切换到云数据库配置
     */
    switchToCloud() {
        this.config = { ...this.cloudConfig };
        if (this.pool) {
            this.pool.end().then(() => {
                this.initializePool();
                this.emit('config:switched', 'cloud');
            });
        }
    }
    
    /**
     * 切换到本地数据库配置
     */
    switchToLocal() {
        this.config = { ...this.defaultConfig };
        if (this.pool) {
            this.pool.end().then(() => {
                this.initializePool();
                this.emit('config:switched', 'local');
            });
        }
    }
}

module.exports = DatabaseManager;