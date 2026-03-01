#!/usr/bin/env node

/**
 * 部署后验证脚本
 * 检查服务器上nginx配置是否正确应用
 */

const { execSync } = require('child_process');

console.log('🔍 开始部署后验证...\n');

// SSH连接信息
const SSH_KEY = 'C:/Users/66948/.ssh/PWA应用密钥.pem';
const SSH_HOST = 'root@8.145.34.30';
const PROJECT_PATH = '/root/smart-kitchen';

function runSSHCommand(command) {
  try {
    const fullCommand = `ssh -i "${SSH_KEY}" ${SSH_HOST} "${command}"`;
    return execSync(fullCommand, { encoding: 'utf8' });
  } catch (error) {
    console.error(`❌ 命令执行失败: ${error.message}`);
    return null;
  }
}

console.log('1. 检查服务状态...');
const serviceStatus = runSSHCommand(`cd ${PROJECT_PATH} && docker compose ps`);
if (serviceStatus) {
  console.log(serviceStatus);
}

console.log('\n2. 检查前端容器nginx配置...');
const frontendContainer = runSSHCommand(`cd ${PROJECT_PATH} && docker compose ps --services | grep frontend | head -n 1`);
if (frontendContainer) {
  const containerName = frontendContainer.trim();
  console.log(`前端容器: ${containerName}`);
  
  // 检查nginx配置语法
  const configTest = runSSHCommand(`docker exec ${containerName} nginx -t`);
  if (configTest && configTest.includes('successful')) {
    console.log('✅ Nginx配置语法正确');
  } else {
    console.log('❌ Nginx配置语法错误');
    console.log(configTest);
  }
  
  // 显示配置文件内容
  console.log('\n当前nginx配置内容:');
  const configFile = runSSHCommand(`docker exec ${containerName} cat /etc/nginx/conf.d/default.conf`);
  if (configFile) {
    console.log(configFile.split('\n').slice(0, 30).join('\n'));
  }
  
  // 检查API代理配置
  if (configFile && configFile.includes('location /api/')) {
    console.log('\n✅ 包含API代理配置');
  } else {
    console.log('\n❌ 缺少API代理配置');
  }
  
  // 检查SPA路由配置
  if (configFile && configFile.includes('try_files $uri $uri/ /index.html')) {
    console.log('✅ 包含SPA路由配置');
  } else {
    console.log('❌ 缺少SPA路由配置');
  }
}

console.log('\n3. 检查服务连通性...');
// 检查前端服务
const frontendHealth = runSSHCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost');
if (frontendHealth === '200') {
  console.log('✅ 前端服务正常 (200 OK)');
} else {
  console.log(`❌ 前端服务异常 (${frontendHealth})`);
}

// 检查API服务
const apiHealth = runSSHCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health');
if (apiHealth === '200') {
  console.log('✅ 后端API服务正常 (200 OK)');
} else {
  console.log(`❌ 后端API服务异常 (${apiHealth})`);
}

console.log('\n4. 检查容器日志...');
const frontendLogs = runSSHCommand(`docker logs ${containerName} --tail 20 2>/dev/null`);
if (frontendLogs) {
  console.log('前端容器最近日志:');
  console.log(frontendLogs);
}

console.log('\n🎉 部署验证完成！');