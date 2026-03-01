#!/usr/bin/env node

/**
 * 自动修复和部署脚本
 * 解决因未提交更改导致GitHub Actions不触发的问题
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Smart Kitchen 自动修复和部署\n');

async function main() {
  try {
    // 1. 检查当前Git状态
    console.log('=== 1. 检查Git状态 ===');
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (!gitStatus.trim()) {
      console.log('✅ 工作目录干净，无需提交');
      return;
    }
    
    console.log('发现未提交的更改:');
    console.log(gitStatus);
    
    // 2. 添加所有更改
    console.log('\n=== 2. 添加更改 ===');
    execSync('git add .', { stdio: 'inherit' });
    console.log('✅ 所有更改已添加到暂存区');
    
    // 3. 创建提交
    console.log('\n=== 3. 创建提交 ===');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const commitMessage = `fix: 自动部署修复 (${timestamp})`;
    
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    console.log('✅ 提交创建成功');
    
    // 4. 推送到远程仓库
    console.log('\n=== 4. 推送更改 ===');
    console.log('正在推送到远程仓库...');
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('✅ 推送成功！');
    
    // 5. 验证推送状态
    console.log('\n=== 5. 验证推送状态 ===');
    const localCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const remoteCommit = execSync('git rev-parse origin/main', { encoding: 'utf8' }).trim();
    
    if (localCommit === remoteCommit) {
      console.log('✅ 本地和远程分支同步');
    } else {
      console.log('⚠️ 本地和远程分支不同步');
      console.log(`本地: ${localCommit}`);
      console.log(`远程: ${remoteCommit}`);
    }
    
    // 6. 触发GitHub Actions检查
    console.log('\n=== 6. GitHub Actions状态 ===');
    console.log('GitHub Actions应该已经自动触发');
    console.log('请访问以下链接查看部署状态:');
    console.log('https://github.com/your-username/smart-kitchen/actions');
    
    // 7. 提供后续验证建议
    console.log('\n=== 7. 验证建议 ===');
    console.log('部署完成后，请检查:');
    console.log('1. 生产环境页面是否已更新');
    console.log('2. 控制台是否有错误信息');
    console.log('3. 网络面板确认加载的是最新资源');
    console.log('4. 如果仍有问题，尝试硬刷新 (Ctrl+F5)');
    
    console.log('\n🎉 自动修复和部署完成！');
    
  } catch (error) {
    console.error('\n❌ 执行过程中出现错误:');
    console.error(error.message);
    
    // 提供手动解决建议
    console.log('\n💡 手动解决建议:');
    console.log('1. 运行: git add .');
    console.log('2. 运行: git commit -m "fix: 手动部署修复"');
    console.log('3. 运行: git push origin main');
    console.log('4. 访问GitHub查看Actions运行状态');
  }
}

// 执行主函数
main();