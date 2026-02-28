#!/usr/bin/env node

/**
 * 部署后验证脚本
 * 验证服务是否正常运行以及数据完整性
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function runPostDeploymentVerification() {
    console.log('✅ 部署后验证检查\n');
    
    const checks = [
        {
            name: '服务状态检查',
            check: checkServiceStatus,
            critical: true
        },
        {
            name: '数据完整性检查',
            check: checkDataIntegrity,
            critical: true
        },
        {
            name: 'API健康检查',
            check: checkApiHealth,
            critical: true
        },
        {
            name: '前端页面访问检查',
            check: checkFrontendAccess,
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
    console.log(`验证结果: ${passed} 通过, ${warnings} 警告, ${failed} 失败`);
    
    if (failed > 0) {
        console.log('\n🚨 部署验证失败，请检查服务状态！');
        process.exit(1);
    } else {
        console.log('\n✅ 部署验证通过，服务运行正常！');
        process.exit(0);
    }
}

// 检查Docker服务状态
async function checkServiceStatus() {
    try {
        const { stdout } = await execAsync('docker compose ps --format json');
        const services = JSON.parse(stdout);
        
        const requiredServices = ['backend', 'frontend', 'postgres'];
        const missingServices = [];
        
        for (const serviceName of requiredServices) {
            const service = services.find(s => s.Service === serviceName);
            if (!service || service.State !== 'running') {
                missingServices.push(serviceName);
            }
        }
        
        if (missingServices.length > 0) {
            return { 
                passed: false, 
                message: `服务未运行: ${missingServices.join(', ')}` 
            };
        }
        
        return { passed: true };
    } catch (error) {
        return { 
            passed: false, 
            message: `检查服务状态失败: ${error.message}` 
        };
    }
}

// 检查数据完整性
async function checkDataIntegrity() {
    try {
        // 检查菜品数量
        const { stdout: dishCount } = await execAsync(
            'docker compose exec -T postgres psql -U smart_kitchen -d smart_kitchen_prod -t -c "SELECT COUNT(*) FROM dishes;"'
        );
        
        const count = parseInt(dishCount.trim());
        
        if (isNaN(count)) {
            return { 
                passed: false, 
                message: '无法获取菜品数量' 
            };
        }
        
        if (count < 10) {
            return { 
                passed: false, 
                message: `菜品数量异常: ${count} (期望 >= 10)` 
            };
        }
        
        // 检查关键表是否存在
        const { stdout: tableCheck } = await execAsync(
            'docker compose exec -T postgres psql -U smart_kitchen -d smart_kitchen_prod -t -c "SELECT tablename FROM pg_tables WHERE schemaname = \'public\' AND tablename IN (\'dishes\', \'orders\', \'dish_categories\');"'
        );
        
        const tables = tableCheck.trim().split('\n').filter(line => line.trim()).length;
        if (tables < 3) {
            return { 
                passed: false, 
                message: `关键表缺失，只找到 ${tables} 个表` 
            };
        }
        
        console.log(`  📊 菜品数量: ${count}`);
        console.log(`  📋 关键表数量: ${tables}`);
        
        return { passed: true };
    } catch (error) {
        return { 
            passed: false, 
            message: `数据完整性检查失败: ${error.message}` 
        };
    }
}

// 检查API健康状态
async function checkApiHealth() {
    try {
        const { stdout, stderr } = await execAsync('curl -f http://localhost:3001/api/health', {
            timeout: 10000
        });
        
        if (stdout.includes('ok') || stdout.includes('healthy')) {
            return { passed: true };
        } else {
            return { 
                passed: false, 
                message: 'API返回异常状态' 
            };
        }
    } catch (error) {
        return { 
            passed: false, 
            message: `API健康检查失败: ${error.message}` 
        };
    }
}

// 检查前端页面访问
async function checkFrontendAccess() {
    try {
        const { stdout, stderr } = await execAsync('curl -f http://localhost -I', {
            timeout: 10000
        });
        
        if (stdout.includes('200 OK')) {
            // 检查是否返回HTML内容
            const { stdout: content } = await execAsync('curl -f http://localhost');
            if (content.includes('<html') || content.includes('<!DOCTYPE')) {
                return { passed: true };
            } else {
                return { 
                    passed: false, 
                    message: '前端返回内容不是HTML页面' 
                };
            }
        } else {
            return { 
                passed: false, 
                message: '前端页面访问失败' 
            };
        }
    } catch (error) {
        return { 
            passed: false, 
            message: `前端访问检查失败: ${error.message}` 
        };
    }
}

// 执行验证
if (require.main === module) {
    runPostDeploymentVerification().catch(error => {
        console.error('验证执行失败:', error);
        process.exit(1);
    });
}

module.exports = { runPostDeploymentVerification };