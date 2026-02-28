#!/usr/bin/env node

/**
 * 生产环境部署安全检查脚本
 * 在执行任何可能影响生产数据的操作前运行此脚本
 */

const fs = require('fs');
const path = require('path');

async function runSafetyChecks() {
    console.log('🔒 生产环境部署安全检查\n');
    
    const checks = [
        {
            name: '检查seed脚本安全性',
            check: checkSeedScriptSafety,
            critical: true
        },
        {
            name: '检查环境变量配置',
            check: checkEnvironmentConfig,
            critical: true
        },
        {
            name: '检查数据库连接配置',
            check: checkDatabaseConfig,
            critical: true
        },
        {
            name: '检查危险操作关键词',
            check: checkDangerousKeywords,
            critical: true
        }
    ];
    
    let passed = 0;
    let failed = 0;
    let warnings = 0;
    
    for (const check of checks) {
        try {
            const result = await check.check();
            if (result.passed) {
                console.log(`✅ ${check.name}`);
                passed++;
            } else {
                if (check.critical) {
                    console.log(`❌ ${check.name} - ${result.message}`);
                    failed++;
                } else {
                    console.log(`⚠️  ${check.name} - ${result.message}`);
                    warnings++;
                }
            }
        } catch (error) {
            console.log(`❌ ${check.name} - 检查失败: ${error.message}`);
            if (check.critical) {
                failed++;
            } else {
                warnings++;
            }
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`检查结果: ${passed} 通过, ${warnings} 警告, ${failed} 失败`);
    
    if (failed > 0) {
        console.log('\n🚨 发现严重安全问题，部署已中止！');
        process.exit(1);
    } else if (warnings > 0) {
        console.log('\n⚠️  发现警告，请仔细检查后再继续部署');
        // 可以选择是否继续
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        return new Promise((resolve) => {
            rl.question('是否继续部署? (y/N): ', (answer) => {
                rl.close();
                if (answer.toLowerCase() === 'y') {
                    console.log('继续部署...');
                    resolve(true);
                } else {
                    console.log('部署已取消');
                    process.exit(1);
                }
            });
        });
    } else {
        console.log('\n✅ 所有安全检查通过，可以安全部署');
        return true;
    }
}

// 检查seed脚本是否包含危险操作
async function checkSeedScriptSafety() {
    const seedPath = path.join(__dirname, '../backend/prisma/seed.ts');
    
    if (!fs.existsSync(seedPath)) {
        return { passed: true, message: 'seed.ts文件不存在' };
    }
    
    const content = fs.readFileSync(seedPath, 'utf8');
    const dangerousPatterns = [
        'deleteMany()',
        'delete()',
        'truncate',
        'drop',
        'clear'
    ];
    
    const foundDangers = dangerousPatterns.filter(pattern => 
        content.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (foundDangers.length > 0) {
        return { 
            passed: false, 
            message: `发现危险操作: ${foundDangers.join(', ')}` 
        };
    }
    
    // 检查是否有环境保护机制
    const hasProtection = content.includes('process.env.NODE_ENV') || 
                         content.includes('production') ||
                         content.includes('environment check');
    
    if (!hasProtection) {
        return { 
            passed: false, 
            message: '缺少环境保护机制' 
        };
    }
    
    return { passed: true };
}

// 检查环境配置
async function checkEnvironmentConfig() {
    const envPath = path.join(__dirname, '../.env.production');
    
    if (!fs.existsSync(envPath)) {
        return { passed: false, message: '.env.production文件不存在' };
    }
    
    const content = fs.readFileSync(envPath, 'utf8');
    
    // 检查关键配置
    const requiredVars = ['NODE_ENV', 'DATABASE_URL'];
    const missingVars = requiredVars.filter(varName => 
        !content.includes(`${varName}=`) || 
        content.includes(`${varName}=""`) ||
        content.includes(`${varName}=''`)
    );
    
    if (missingVars.length > 0) {
        return { 
            passed: false, 
            message: `缺少必要环境变量: ${missingVars.join(', ')}` 
        };
    }
    
    // 检查是否为生产环境配置
    if (!content.includes('NODE_ENV=production')) {
        return { 
            passed: false, 
            message: '环境变量未设置为production' 
        };
    }
    
    return { passed: true };
}

// 检查数据库配置
async function checkDatabaseConfig() {
    const envPath = path.join(__dirname, '../.env.production');
    const content = fs.readFileSync(envPath, 'utf8');
    
    // 检查数据库URL格式
    const dbUrlMatch = content.match(/DATABASE_URL=(.+)/);
    if (!dbUrlMatch) {
        return { passed: false, message: '未找到DATABASE_URL配置' };
    }
    
    const dbUrl = dbUrlMatch[1].trim();
    if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
        return { 
            passed: false, 
            message: '数据库配置指向本地环境，不是生产环境' 
        };
    }
    
    // 检查是否包含生产环境标识
    if (!dbUrl.includes('prod') && !dbUrl.includes('production')) {
        return { 
            passed: false, 
            message: '数据库URL未明确标识为生产环境' 
        };
    }
    
    return { passed: true };
}

// 检查危险关键词
async function checkDangerousKeywords() {
    const backendDir = path.join(__dirname, '../backend');
    const dangerousKeywords = [
        'deleteMany',
        'truncate',
        'drop table',
        'rm -rf',
        'destroy'
    ];
    
    let foundIssues = [];
    
    function scanDirectory(dir) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                // 跳过node_modules等目录
                if (!['node_modules', '.git', 'dist'].includes(file)) {
                    scanDirectory(filePath);
                }
            } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.ts'))) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    for (const keyword of dangerousKeywords) {
                        if (content.toLowerCase().includes(keyword.toLowerCase())) {
                            foundIssues.push({
                                file: path.relative(backendDir, filePath),
                                keyword: keyword
                            });
                        }
                    }
                } catch (error) {
                    // 忽略读取错误
                }
            }
        }
    }
    
    scanDirectory(backendDir);
    
    if (foundIssues.length > 0) {
        const issueList = foundIssues.map(issue => 
            `${issue.file}: ${issue.keyword}`
        ).join('\n  ');
        return { 
            passed: false, 
            message: `发现潜在危险代码:\n  ${issueList}` 
        };
    }
    
    return { passed: true };
}

// 执行检查
if (require.main === module) {
    runSafetyChecks().catch(error => {
        console.error('安全检查执行失败:', error);
        process.exit(1);
    });
}

module.exports = { runSafetyChecks };