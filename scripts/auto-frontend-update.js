#!/usr/bin/env node

/**
 * 自动化前端更新部署脚本
 * 用于检测前端代码变更并自动触发更新部署
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const fs = require('fs');
const path = require('path');

async function autoFrontendUpdate() {
    console.log('🚀 自动前端更新部署启动\n');
    
    try {
        // 1. 检查本地是否有未提交的前端更改
        console.log('🔍 检查本地前端更改...');
        const { stdout: status } = await execAsync('git status --porcelain frontend/');
        if (status.trim()) {
            console.log('📝 发现未提交的前端更改:');
            console.log(status);
            
            // 自动提交更改
            console.log('💾 自动提交前端更改...');
            await execAsync('git add frontend/');
            await execAsync('git commit -m "feat: auto-update frontend assets"');
            await execAsync('git push origin main');
            console.log('✅ 前端更改已推送');
        } else {
            console.log('✅ 本地前端代码已是最新');
        }

        // 2. 检查GitHub Actions状态
        console.log('\n🔄 检查GitHub Actions部署状态...');
        // 这里可以添加检查workflow状态的逻辑
        
        // 3. 如果需要，手动触发服务器更新
        console.log('\n🖥️  检查服务器前端状态...');
        const serverCheck = await checkServerFrontendStatus();
        
        if (!serverCheck.isUpdated) {
            console.log('⚠️  服务器前端需要更新');
            await triggerServerUpdate();
        } else {
            console.log('✅ 服务器前端已是最新版本');
        }

        // 4. 验证更新结果
        console.log('\n✅ 前端更新部署完成！');
        await verifyFrontendUpdate();
        
    } catch (error) {
        console.error('❌ 自动更新过程中出现错误:', error);
        process.exit(1);
    }
}

async function checkServerFrontendStatus() {
    try {
        const { stdout: buildTime } = await execAsync(
            'ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30 "docker compose exec frontend stat -c %Y /usr/share/nginx/html/index.html"'
        );
        
        const timestamp = parseInt(buildTime.trim());
        const buildDate = new Date(timestamp * 1000);
        const now = new Date();
        const hoursDiff = Math.abs(now - buildDate) / (1000 * 60 * 60);
        
        console.log(`  服务器前端构建时间: ${buildDate.toLocaleString()}`);
        console.log(`  距离现在: ${hoursDiff.toFixed(1)} 小时`);
        
        // 如果超过24小时认为需要更新
        return { 
            isUpdated: hoursDiff < 24,
            buildDate: buildDate,
            hoursDiff: hoursDiff
        };
        
    } catch (error) {
        console.log('  ❌ 无法获取服务器前端状态');
        return { isUpdated: false };
    }
}

async function triggerServerUpdate() {
    console.log('🔧 触发服务器前端更新...');
    
    try {
        // 方法1: 重新构建前端容器
        console.log('  🏗️  重新构建前端容器...');
        await execAsync(
            'ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30 "cd /root/smart-kitchen && docker compose build frontend && docker compose up -d frontend"',
            { timeout: 300000 } // 5分钟超时
        );
        
        console.log('  ✅ 前端容器重建完成');
        
        // 等待容器启动
        await new Promise(resolve => setTimeout(resolve, 15000));
        
    } catch (error) {
        console.log('  ❌ 容器重建失败，尝试其他方法...');
        
        // 方法2: 手动拉取最新镜像
        try {
            console.log('  📦 尝试拉取最新镜像...');
            await execAsync(
                'ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30 "cd /root/smart-kitchen && docker compose pull frontend && docker compose up -d frontend"'
            );
            console.log('  ✅ 镜像拉取完成');
        } catch (error2) {
            console.log('  ❌ 镜像拉取也失败了');
            throw error2;
        }
    }
}

async function verifyFrontendUpdate() {
    console.log('\n🔍 验证前端更新结果...');
    
    try {
        // 检查服务器状态
        const { stdout: containerStatus } = await execAsync(
            'ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30 "cd /root/smart-kitchen && docker compose ps frontend"'
        );
        console.log('容器状态:');
        console.log(containerStatus);
        
        // 测试页面访问
        const { stdout: pageResponse } = await execAsync('curl -s -o /dev/null -w "%{http_code}" "http://8.145.34.30"');
        if (pageResponse.trim() === '200') {
            console.log('✅ 前端页面访问正常');
        } else {
            console.log(`❌ 前端页面访问异常 (HTTP ${pageResponse.trim()})`);
        }
        
        // 检查构建时间
        const { stdout: newBuildTime } = await execAsync(
            'ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30 "docker compose exec frontend stat -c %y /usr/share/nginx/html/index.html"'
        );
        console.log(`📅 最新构建时间: ${newBuildTime.trim()}`);
        
    } catch (error) {
        console.log('❌ 验证过程中出现错误:', error.message);
    }
}

// 执行自动更新
if (require.main === module) {
    autoFrontendUpdate().catch(error => {
        console.error('自动更新执行失败:', error);
        process.exit(1);
    });
}

module.exports = { autoFrontendUpdate };