#!/usr/bin/env node

/**
 * 生产环境部署前安全检查脚本
 * 在GitHub Actions部署前执行，确保不会造成数据丢失
 */

const fs = require('fs');
const path = require('path');

async function runPreDeploymentSafetyCheck() {
    console.log('🛡️  生产环境部署前安全检查\n');
    
    const checks = [
        {
            name: 'Seed脚本危险操作检查',
            check: checkSeedScriptForDangerousOperations,
            critical: true
        },
        {
            name: '数据库迁移文件检查',
            check: checkMigrationFiles,
            critical: true
        },
        {
            name: '环境配置检查',
            check: checkEnvironmentConfiguration,
            critical: true
        },
        {
            name: '关键文件完整性检查',
            check: checkCriticalFilesIntegrity,
            critical: false
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
        console.log('\n⚠️  发现警告，请仔细审查后再继续部署');
        process.exit(0); // 警告不阻止部署，但需要人工审查
    } else {
        console.log('\n✅ 所有安全检查通过，可以安全部署');
        process.exit(0);
    }
}

// 检查seed脚本是否包含危险操作
async function checkSeedScriptForDangerousOperations() {
    const seedPath = path.join(__dirname, '../backend/prisma/seed.ts');
    
    if (!fs.existsSync(seedPath)) {
        return { passed: true, message: 'seed.ts文件不存在' };
    }
    
    const content = fs.readFileSync(seedPath, 'utf8');
    
    // 危险操作关键词列表
    const dangerousPatterns = [
        'deleteMany()',
        'delete()',
        'truncate',
        'drop table',
        'clear',
        'reset',
        'destroy'
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
    
    // 检查是否有生产环境保护机制
    const hasProductionProtection = content.includes('process.env.NODE_ENV') && 
                                   content.includes('production');
    
    if (!hasProductionProtection) {
        return { 
            passed: false, 
            message: '缺少生产环境保护机制' 
        };
    }
    
    // 检查是否有增量式创建逻辑
    const hasIncrementalLogic = content.includes('findFirst') || 
                               content.includes('findUnique') ||
                               content.includes('exists');
    
    if (!hasIncrementalLogic) {
        return { 
            passed: false, 
            message: '缺少增量式数据创建逻辑' 
        };
    }
    
    return { passed: true };
}

// 检查数据库迁移文件
async function checkMigrationFiles() {
    const migrationsDir = path.join(__dirname, '../backend/prisma/migrations');
    
    if (!fs.existsSync(migrationsDir)) {
        return { passed: true, message: '无迁移文件' };
    }
    
    const migrationDirs = fs.readdirSync(migrationsDir)
        .filter(dir => fs.statSync(path.join(migrationsDir, dir)).isDirectory());
    
    if (migrationDirs.length === 0) {
        return { passed: true, message: '无迁移目录' };
    }
    
    // 检查最新的迁移文件
    const latestMigration = migrationDirs.sort().pop();
    const migrationPath = path.join(migrationsDir, latestMigration, 'migration.sql');
    
    if (!fs.existsSync(migrationPath)) {
        return { passed: false, message: '最新迁移目录缺少migration.sql文件' };
    }
    
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    
    // 检查是否包含危险操作
    const dangerousOps = ['DROP', 'TRUNCATE', 'DELETE FROM'];
    const foundDangers = dangerousOps.filter(op => 
        migrationContent.toUpperCase().includes(op)
    );
    
    if (foundDangers.length > 0) {
        return { 
            passed: false, 
            message: `迁移文件包含危险操作: ${foundDangers.join(', ')}` 
        };
    }
    
    return { passed: true };
}

// 检查环境配置
async function checkEnvironmentConfiguration() {
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
    
    // 检查数据库URL是否指向生产环境
    const dbUrlMatch = content.match(/DATABASE_URL=(.+)/);
    if (dbUrlMatch) {
        const dbUrl = dbUrlMatch[1].trim();
        if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
            return { 
                passed: false, 
                message: '数据库配置指向本地环境' 
            };
        }
    }
    
    return { passed: true };
}

// 检查关键文件完整性
async function checkCriticalFilesIntegrity() {
    const criticalFiles = [
        'backend/package.json',
        'frontend/package.json',
        'docker-compose.yml',
        'backend/prisma/schema.prisma'
    ];
    
    const missingFiles = criticalFiles.filter(file => 
        !fs.existsSync(path.join(__dirname, '..', file))
    );
    
    if (missingFiles.length > 0) {
        return { 
            passed: false, 
            message: `缺少关键文件: ${missingFiles.join(', ')}` 
        };
    }
    
    return { passed: true };
}

// 执行检查
if (require.main === module) {
    runPreDeploymentSafetyCheck().catch(error => {
        console.error('安全检查执行失败:', error);
        process.exit(1);
    });
}

module.exports = { runPreDeploymentSafetyCheck };