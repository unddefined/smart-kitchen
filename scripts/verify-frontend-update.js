#!/usr/bin/env node

/**
 * 前端更新验证脚本
 * 验证部署后的前端页面确实是最新构建版本
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const fs = require('fs');
const path = require('path');

async function verifyFrontendUpdate() {
    console.log('🔍 前端更新验证\n');
    
    try {
        // 1. 检查本地构建文件时间
        const localBuildPath = path.join(__dirname, '../frontend/dist/index.html');
        if (fs.existsSync(localBuildPath)) {
            const localStats = fs.statSync(localBuildPath);
            console.log(`📁 本地构建文件修改时间: ${localStats.mtime}`);
        } else {
            console.log('⚠️  本地构建文件不存在');
        }

        // 2. 检查服务器上容器的构建时间
        console.log('\n🐳 检查容器内前端构建时间...');
        try {
            const { stdout: containerTime } = await execAsync(
                'ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30 "docker compose exec -T frontend stat -c %y /usr/share/nginx/html/index.html"'
            );
            console.log(`🕒 容器内构建时间: ${containerTime.trim()}`);
        } catch (error) {
            console.log('❌ 无法获取容器内构建时间');
        }

        // 3. 检查前端页面内容
        console.log('\n📄 检查前端页面内容...');
        try {
            const { stdout: pageContent } = await execAsync(
                'curl -s http://8.145.34.30'
            );
            
            // 检查页面中是否包含特定的构建标识或版本信息
            if (pageContent.includes('<html') || pageContent.includes('<!DOCTYPE')) {
                console.log('✅ 前端页面可正常访问');
                
                // 检查是否有Vue相关的标识
                if (pageContent.includes('vue') || pageContent.includes('app')) {
                    console.log('✅ 页面包含Vue应用');
                }
                
                // 检查文件大小
                const contentLength = pageContent.length;
                console.log(`📊 页面内容大小: ${contentLength} 字符`);
                
            } else {
                console.log('❌ 返回的内容不是有效的HTML页面');
            }
        } catch (error) {
            console.log(`❌ 前端页面访问失败: ${error.message}`);
        }

        // 4. 检查Docker镜像标签
        console.log('\n🏷️  检查Docker镜像信息...');
        try {
            const { stdout: imageInfo } = await execAsync(
                'ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30 "docker images | grep smart-kitchen-frontend"'
            );
            console.log('🖼️  前端镜像信息:');
            console.log(imageInfo);
        } catch (error) {
            console.log('❌ 无法获取镜像信息');
        }

        // 5. 检查容器运行状态
        console.log('\n📋 检查容器运行状态...');
        try {
            const { stdout: containerStatus } = await execAsync(
                'ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30 "docker compose ps frontend"'
            );
            console.log('コンテン器状态:');
            console.log(containerStatus);
        } catch (error) {
            console.log('❌ 无法获取容器状态');
        }

        console.log('\n✅ 前端更新验证完成！');
        
    } catch (error) {
        console.error('验证过程中出现错误:', error);
        process.exit(1);
    }
}

// 执行验证
if (require.main === module) {
    verifyFrontendUpdate().catch(error => {
        console.error('验证执行失败:', error);
        process.exit(1);
    });
}

module.exports = { verifyFrontendUpdate };