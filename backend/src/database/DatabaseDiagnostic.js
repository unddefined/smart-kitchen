const DatabaseManager = require('./DatabaseManager');
const fs = require('fs').promises;
const path = require('path');

/**
 * 数据库诊断和监控工具
 * 实现分层测试策略和可视化报告生成
 */
class DatabaseDiagnostic {
    constructor(config = {}) {
        this.dbManager = new DatabaseManager(config);
        this.testResults = [];
        this.performanceMetrics = {};
    }
    
    /**
     * 执行完整的数据库诊断流程
     */
    async runFullDiagnostics() {
        console.log('🔬 开始数据库全面诊断...\n');
        
        const diagnostics = [
            { name: '基础连接测试', func: () => this.testBasicConnection() },
            { name: '连接池健康检查', func: () => this.testConnectionPool() },
            { name: '性能基准测试', func: () => this.testPerformance() },
            { name: '数据完整性检查', func: () => this.testDataIntegrity() },
            { name: '安全性检查', func: () => this.testSecurity() }
        ];
        
        const results = [];
        
        for (const diagnostic of diagnostics) {
            try {
                console.log(`🧪 执行: ${diagnostic.name}`);
                const result = await diagnostic.func();
                results.push({ ...result, testName: diagnostic.name });
                console.log(`✅ ${diagnostic.name}: ${result.status}\n`);
            } catch (error) {
                console.log(`❌ ${diagnostic.name}: 失败 - ${error.message}\n`);
                results.push({
                    testName: diagnostic.name,
                    status: 'failed',
                    error: error.message
                });
            }
        }
        
        this.testResults = results;
        return this.generateReport();
    }
    
    /**
     * 基础连接测试
     */
    async testBasicConnection() {
        const startTime = Date.now();
        
        try {
            const connectionInfo = await this.dbManager.testConnection(3000);
            const latency = Date.now() - startTime;
            
            return {
                status: 'passed',
                latency: latency,
                connectionInfo: connectionInfo,
                recommendations: []
            };
        } catch (error) {
            return {
                status: 'failed',
                error: error.message,
                latency: Date.now() - startTime,
                recommendations: [
                    '检查网络连接',
                    '验证数据库服务状态',
                    '确认连接参数正确性'
                ]
            };
        }
    }
    
    /**
     * 连接池健康检查
     */
    async testConnectionPool() {
        try {
            const healthStatus = await this.dbManager.healthCheck(true);
            const poolStats = this.dbManager.getPoolStats();
            
            const issues = [];
            const recommendations = [];
            
            // 检查连接池状态
            if (poolStats.waitingCount > 5) {
                issues.push(`过多等待连接: ${poolStats.waitingCount}`);
                recommendations.push('考虑增加最大连接数');
            }
            
            if (poolStats.idleCount < 2) {
                issues.push('空闲连接不足');
                recommendations.push('调整最小连接数配置');
            }
            
            // 检查错误率
            const errorRate = poolStats.metrics.errorCount / Math.max(poolStats.metrics.queryCount, 1);
            if (errorRate > 0.05) {
                issues.push(`高错误率: ${(errorRate * 100).toFixed(2)}%`);
                recommendations.push('检查查询语句和数据库负载');
            }
            
            return {
                status: issues.length === 0 ? 'passed' : 'warning',
                poolStats: poolStats,
                healthStatus: healthStatus,
                issues: issues,
                recommendations: recommendations
            };
        } catch (error) {
            return {
                status: 'failed',
                error: error.message,
                recommendations: ['检查数据库连接池配置']
            };
        }
    }
    
    /**
     * 性能基准测试
     */
    async testPerformance() {
        const testQueries = [
            { name: '简单查询', sql: 'SELECT 1' },
            { name: '元数据查询', sql: "SELECT version(), current_database()" },
            { name: '表统计查询', sql: `
                SELECT COUNT(*) as table_count 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `},
            { name: '复杂连接查询', sql: `
                SELECT 
                    COUNT(d.id) as dish_count,
                    COUNT(DISTINCT dc.id) as category_count,
                    COUNT(DISTINCT s.id) as station_count
                FROM dishes d
                LEFT JOIN dish_categories dc ON d.category_id = dc.id
                LEFT JOIN stations s ON d.station_id = s.id
            `}
        ];
        
        const performanceResults = [];
        const startTime = Date.now();
        
        try {
            for (const testQuery of testQueries) {
                const queryStartTime = Date.now();
                try {
                    await this.dbManager.query(testQuery.sql);
                    const duration = Date.now() - queryStartTime;
                    
                    performanceResults.push({
                        testName: testQuery.name,
                        status: 'passed',
                        duration: duration,
                        sql: testQuery.sql
                    });
                } catch (error) {
                    performanceResults.push({
                        testName: testQuery.name,
                        status: 'failed',
                        error: error.message,
                        duration: Date.now() - queryStartTime
                    });
                }
            }
            
            const totalTime = Date.now() - startTime;
            const avgTime = totalTime / testQueries.length;
            
            // 性能评级
            let rating = 'excellent';
            if (avgTime > 500) rating = 'good';
            if (avgTime > 1000) rating = 'fair';
            if (avgTime > 2000) rating = 'poor';
            
            return {
                status: rating === 'poor' ? 'warning' : 'passed',
                totalTime: totalTime,
                averageTime: avgTime,
                rating: rating,
                testResults: performanceResults,
                recommendations: this.getPerformanceRecommendations(avgTime, performanceResults)
            };
        } catch (error) {
            return {
                status: 'failed',
                error: error.message,
                recommendations: ['检查数据库性能配置']
            };
        }
    }
    
    /**
     * 数据完整性检查
     */
    async testDataIntegrity() {
        try {
            const integrityChecks = [
                {
                    name: '外键约束检查',
                    sql: `
                        SELECT 
                            tc.table_name,
                            kcu.column_name,
                            ccu.table_name AS foreign_table_name,
                            ccu.column_name AS foreign_column_name
                        FROM information_schema.table_constraints AS tc
                        JOIN information_schema.key_column_usage AS kcu
                          ON tc.constraint_name = kcu.constraint_name
                        JOIN information_schema.constraint_column_usage AS ccu
                          ON ccu.constraint_name = tc.constraint_name
                        WHERE tc.constraint_type = 'FOREIGN KEY' 
                        AND tc.table_schema = 'public'
                    `
                },
                {
                    name: '索引检查',
                    sql: `
                        SELECT 
                            tablename,
                            indexname,
                            indexdef
                        FROM pg_indexes 
                        WHERE schemaname = 'public'
                        ORDER BY tablename, indexname
                    `
                },
                {
                    name: '数据一致性检查',
                    sql: `
                        SELECT 
                            'dishes_without_category' as check_name,
                            COUNT(*) as issue_count
                        FROM dishes 
                        WHERE category_id IS NULL OR category_id = 0
                        UNION ALL
                        SELECT 
                            'dishes_without_station' as check_name,
                            COUNT(*) as issue_count
                        FROM dishes 
                        WHERE station_id IS NULL OR station_id = 0
                    `
                }
            ];
            
            const checkResults = [];
            
            for (const check of integrityChecks) {
                try {
                    const result = await this.dbManager.query(check.sql);
                    checkResults.push({
                        checkName: check.name,
                        status: 'passed',
                        resultCount: result.rowCount,
                        sampleData: result.rows.slice(0, 3)
                    });
                } catch (error) {
                    checkResults.push({
                        checkName: check.name,
                        status: 'failed',
                        error: error.message
                    });
                }
            }
            
            const failedChecks = checkResults.filter(r => r.status === 'failed').length;
            const hasIssues = checkResults.some(r => 
                r.checkName === '数据一致性检查' && 
                r.sampleData && 
                r.sampleData.some(row => parseInt(row.issue_count) > 0)
            );
            
            return {
                status: failedChecks > 0 || hasIssues ? 'warning' : 'passed',
                checkResults: checkResults,
                recommendations: this.getIntegrityRecommendations(checkResults)
            };
        } catch (error) {
            return {
                status: 'failed',
                error: error.message,
                recommendations: ['检查数据库结构完整性']
            };
        }
    }
    
    /**
     * 安全性检查
     */
    async testSecurity() {
        try {
            const securityChecks = [
                {
                    name: '用户权限检查',
                    sql: `
                        SELECT 
                            usename,
                            usesuper,
                            usecreatedb,
                            passwd IS NOT NULL as has_password
                        FROM pg_user 
                        WHERE usename = current_user
                    `
                },
                {
                    name: '活动连接检查',
                    sql: `
                        SELECT 
                            client_addr,
                            application_name,
                            state,
                            backend_start
                        FROM pg_stat_activity 
                        WHERE datname = current_database()
                        AND client_addr IS NOT NULL
                    `
                },
                {
                    name: 'SSL连接检查',
                    sql: `
                        SELECT 
                            ssl,
                            version,
                            cipher
                        FROM pg_stat_ssl 
                        WHERE pid = pg_backend_pid()
                    `
                }
            ];
            
            const securityResults = [];
            
            for (const check of securityChecks) {
                try {
                    const result = await this.dbManager.query(check.sql);
                    securityResults.push({
                        checkName: check.name,
                        status: 'passed',
                        findings: result.rows
                    });
                } catch (error) {
                    securityResults.push({
                        checkName: check.name,
                        status: 'warning',
                        error: error.message
                    });
                }
            }
            
            return {
                status: 'passed',
                securityResults: securityResults,
                recommendations: this.getSecurityRecommendations(securityResults)
            };
        } catch (error) {
            return {
                status: 'failed',
                error: error.message,
                recommendations: ['检查数据库安全配置']
            };
        }
    }
    
    /**
     * 生成性能建议
     */
    getPerformanceRecommendations(avgTime, testResults) {
        const recommendations = [];
        
        if (avgTime > 1000) {
            recommendations.push('查询性能较慢，建议优化索引');
        }
        
        const failedTests = testResults.filter(t => t.status === 'failed');
        if (failedTests.length > 0) {
            recommendations.push(`有${failedTests.length}个查询测试失败，请检查相关SQL语句`);
        }
        
        return recommendations;
    }
    
    /**
     * 生成完整性建议
     */
    getIntegrityRecommendations(checkResults) {
        const recommendations = [];
        
        const dataConsistencyCheck = checkResults.find(r => r.checkName === '数据一致性检查');
        if (dataConsistencyCheck && dataConsistencyCheck.sampleData) {
            const issues = dataConsistencyCheck.sampleData.filter(row => parseInt(row.issue_count) > 0);
            if (issues.length > 0) {
                recommendations.push('发现数据不一致问题，建议修复缺失的外键关联');
            }
        }
        
        return recommendations;
    }
    
    /**
     * 生成安全建议
     */
    getSecurityRecommendations(securityResults) {
        const recommendations = [];
        
        const userPermCheck = securityResults.find(r => r.checkName === '用户权限检查');
        if (userPermCheck && userPermCheck.findings && userPermCheck.findings.length > 0) {
            const user = userPermCheck.findings[0];
            if (!user.has_password) {
                recommendations.push('建议为数据库用户设置强密码');
            }
            if (user.usesuper) {
                recommendations.push('超级用户权限过高，建议使用专用应用用户');
            }
        }
        
        return recommendations;
    }
    
    /**
     * 生成诊断报告
     */
    async generateReport(format = 'console') {
        const report = {
            timestamp: new Date().toISOString(),
            summary: this.generateSummary(),
            detailedResults: this.testResults,
            performanceMetrics: this.dbManager.getPoolStats()?.metrics,
            recommendations: this.generateOverallRecommendations()
        };
        
        if (format === 'json') {
            return report;
        } else if (format === 'file') {
            const fileName = `db-diagnostic-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            const filePath = path.join(process.cwd(), 'reports', fileName);
            await fs.writeFile(filePath, JSON.stringify(report, null, 2));
            return { filePath, report };
        } else {
            this.printConsoleReport(report);
            return report;
        }
    }
    
    /**
     * 生成摘要
     */
    generateSummary() {
        const passedTests = this.testResults.filter(r => r.status === 'passed').length;
        const warningTests = this.testResults.filter(r => r.status === 'warning').length;
        const failedTests = this.testResults.filter(r => r.status === 'failed').length;
        
        return {
            totalTests: this.testResults.length,
            passed: passedTests,
            warnings: warningTests,
            failed: failedTests,
            overallStatus: failedTests > 0 ? 'failed' : (warningTests > 0 ? 'warning' : 'passed')
        };
    }
    
    /**
     * 生成总体建议
     */
    generateOverallRecommendations() {
        const allRecommendations = [];
        this.testResults.forEach(result => {
            if (result.recommendations && result.recommendations.length > 0) {
                allRecommendations.push(...result.recommendations.map(rec => ({
                    test: result.testName,
                    recommendation: rec
                })));
            }
        });
        return allRecommendations;
    }
    
    /**
     * 打印控制台报告
     */
    printConsoleReport(report) {
        console.log('='.repeat(50));
        console.log('🔬 数据库诊断报告');
        console.log('='.repeat(50));
        console.log(`生成时间: ${report.timestamp}`);
        console.log(`总体状态: ${report.summary.overallStatus.toUpperCase()}`);
        console.log(`测试结果: ${report.summary.passed} 通过, ${report.summary.warnings} 警告, ${report.summary.failed} 失败`);
        console.log('');
        
        console.log('📋 详细测试结果:');
        report.detailedResults.forEach(result => {
            console.log(`  ${result.testName}: ${result.status.toUpperCase()}`);
            if (result.error) {
                console.log(`    错误: ${result.error}`);
            }
        });
        
        console.log('');
        console.log('💡 建议改进措施:');
        if (report.recommendations.length > 0) {
            report.recommendations.forEach((rec, index) => {
                console.log(`  ${index + 1}. [${rec.test}] ${rec.recommendation}`);
            });
        } else {
            console.log('  无特别建议，系统运行良好');
        }
        
        console.log('='.repeat(50));
    }
    
    /**
     * 关闭诊断工具
     */
    async close() {
        await this.dbManager.close();
    }
}

module.exports = DatabaseDiagnostic;