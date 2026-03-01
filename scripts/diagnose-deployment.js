#!/usr/bin/env node

/**
 * 部署状态诊断脚本
 * 用于排查GitHub Actions执行后页面未更新的问题
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Smart Kitchen 部署状态诊断\n');

// 1. 检查本地Git状态
console.log('=== 1. 本地Git状态检查 ===');
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus.trim()) {
    console.log('⚠️  发现未提交的更改:');
    console.log(gitStatus);
  } else {
    console.log('✅ 工作目录干净');
  }
  
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  console.log(`当前分支: ${currentBranch}`);
  
  const lastCommit = execSync('git log -1 --pretty=format:"%h %s (%ci)"', { encoding: 'utf8' }).trim();
  console.log(`最后提交: ${lastCommit}`);
} catch (error) {
  console.error('❌ Git状态检查失败:', error.message);
}

// 2. 检查GitHub Actions配置
console.log('\n=== 2. GitHub Actions配置检查 ===');
const workflowPath = path.join(__dirname, '../.github/workflows/deploy.yml');
if (fs.existsSync(workflowPath)) {
  const workflowContent = fs.readFileSync(workflowPath, 'utf8');
  console.log('✅ 找到部署工作流文件');
  
  // 检查触发条件
  if (workflowContent.includes('on:') && workflowContent.includes('push:')) {
    console.log('✅ 包含push触发条件');
  } else {
    console.log('❌ 缺少push触发条件');
  }
  
  // 检查前端构建配置
  if (workflowContent.includes('frontend/Dockerfile') && workflowContent.includes('npm run build')) {
    console.log('✅ 包含前端构建配置');
  } else {
    console.log('❌ 可能缺少前端构建配置');
  }
} else {
  console.log('❌ 未找到部署工作流文件');
}

// 3. 检查前端Dockerfile
console.log('\n=== 3. 前端Dockerfile检查 ===');
const dockerfilePath = path.join(__dirname, '../frontend/Dockerfile');
if (fs.existsSync(dockerfilePath)) {
  const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
  console.log('✅ 找到前端Dockerfile');
  
  if (dockerfileContent.includes('npm run build')) {
    console.log('✅ 包含构建命令');
  } else {
    console.log('❌ 缺少构建命令');
  }
  
  if (dockerfileContent.includes('COPY --from=build')) {
    console.log('✅ 包含多阶段构建');
  } else {
    console.log('❌ 缺少多阶段构建配置');
  }
} else {
  console.log('❌ 未找到前端Dockerfile');
}

// 4. 检查前端构建配置
console.log('\n=== 4. 前端构建配置检查 ===');
const frontendPackagePath = path.join(__dirname, '../frontend/package.json');
if (fs.existsSync(frontendPackagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
  if (packageJson.scripts && packageJson.scripts.build) {
    console.log('✅ 找到前端构建脚本');
    console.log(`构建命令: ${packageJson.scripts.build}`);
  } else {
    console.log('❌ 未找到前端构建脚本');
  }
} else {
  console.log('❌ 未找到前端package.json');
}

// 5. 模拟构建测试
console.log('\n=== 5. 前端构建测试 ===');
try {
  console.log('🔍 测试前端构建...');
  execSync('cd frontend && npm run build', { stdio: 'pipe' });
  console.log('✅ 前端构建测试成功');
  
  // 检查构建产物
  const distPath = path.join(__dirname, '../frontend/dist');
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    console.log(`✅ 构建产物文件数: ${files.length}`);
    
    if (files.includes('index.html')) {
      const stats = fs.statSync(path.join(distPath, 'index.html'));
      console.log(`✅ index.html 最后修改时间: ${stats.mtime}`);
    }
  }
} catch (error) {
  console.log('❌ 前端构建测试失败:', error.message);
}

// 6. 检查可能的问题原因
console.log('\n=== 6. 常见问题诊断 ===');

const issues = [];

// 检查是否有未推送的提交
try {
  const unpushedCommits = execSync('git log origin/main..HEAD --oneline', { encoding: 'utf8' }).trim();
  if (unpushedCommits) {
    issues.push('❌ 有未推送的提交到远程仓库');
    console.log('未推送的提交:');
    console.log(unpushedCommits);
  } else {
    console.log('✅ 所有提交已推送');
  }
} catch (error) {
  issues.push('⚠️ 无法检查远程提交状态');
}

// 检查工作流文件语法
try {
  execSync('npx yaml-validator .github/workflows/deploy.yml', { stdio: 'pipe' });
  console.log('✅ 工作流文件语法正确');
} catch (error) {
  issues.push('❌ 工作流文件可能存在语法错误');
}

// 7. 提供解决方案建议
console.log('\n=== 7. 解决方案建议 ===');

if (issues.length === 0) {
  console.log('✅ 未发现明显配置问题');
  console.log('\n建议检查:');
  console.log('1. GitHub Actions运行状态 (https://github.com/your-repo/actions)');
  console.log('2. 生产服务器上的容器状态');
  console.log('3. 网络缓存问题 (尝试硬刷新 Ctrl+F5)');
  console.log('4. 浏览器开发者工具检查资源加载');
} else {
  console.log('发现以下问题:');
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
  
  console.log('\n建议解决方案:');
  if (issues.includes('❌ 有未推送的提交到远程仓库')) {
    console.log('- 运行: git push origin main');
  }
  if (issues.includes('❌ 工作流文件可能存在语法错误')) {
    console.log('- 检查.deploy.yml文件语法');
    console.log('- 运行: npx yaml-validator .github/workflows/deploy.yml');
  }
}

console.log('\n=== 诊断完成 ===');