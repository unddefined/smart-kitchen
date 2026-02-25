#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 开始修复端口配置问题...\n');

// 1. 修复docker-compose.prod.yml中的端口配置
const dockerComposePath = path.join(__dirname, 'docker-compose.prod.yml');
let dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf8');

// 将后端端口从3000改为3001以匹配main.ts配置
dockerComposeContent = dockerComposeContent.replace(
  /PORT: 3000/g,
  'PORT: 3001'
).replace(
  /ports:\s*\n\s*- "3000:3000"/g,
  'ports:\n      - "3001:3001"'
).replace(
  /http:\/\/localhost:3000\/api\/health/g,
  'http://localhost:3001/api/health'
);

fs.writeFileSync(dockerComposePath, dockerComposeContent);
console.log('✅ 已更新 docker-compose.prod.yml 端口配置为 3001');

// 2. 修复Nginx配置文件中的端口引用
const nginxConfPath = path.join(__dirname, 'nginx', 'conf.d', 'backend.conf');
let nginxContent = fs.readFileSync(nginxConfPath, 'utf8');

// 统一将所有backend端口引用改为3001
nginxContent = nginxContent.replace(
  /proxy_pass http:\/\/backend:3000/g,
  'proxy_pass http://backend:3001'
);

// 修复健康检查路径
nginxContent = nginxContent.replace(
  /proxy_pass http:\/\/backend:3001\/api\/health/g,
  'proxy_pass http://backend:3001/health'
);

fs.writeFileSync(nginxConfPath, nginxContent);
console.log('✅ 已更新 Nginx 配置中的端口引用');

// 3. 创建简化版的HTTP-only Nginx配置（临时解决SSL问题）
const simpleNginxConf = `
server {
    listen 80;
    server_name 8.145.34.30 localhost;
    
    # API路由
    location /api/ {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 健康检查端点
    location /health {
        proxy_pass http://backend:3001/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # 根路径
    location / {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
`;

const simpleNginxPath = path.join(__dirname, 'nginx', 'conf.d', 'simple-backend.conf');
fs.writeFileSync(simpleNginxPath, simpleNginxConf);
console.log('✅ 已创建简化的HTTP-only Nginx配置');

// 4. 创建测试脚本
const testScript = `
#!/bin/bash
echo "🧪 测试服务连通性..."

# 测试直接访问后端
echo "测试直接访问后端 (端口3001):"
curl -v http://localhost:3001/health 2>&1 | head -20

echo ""
echo "测试通过Nginx访问:"
curl -v http://localhost/health 2>&1 | head -20

echo ""
echo "测试API端点:"
curl -v http://localhost/api/dishes 2>&1 | head -20
`;

const testScriptPath = path.join(__dirname, 'test-connectivity.sh');
fs.writeFileSync(testScriptPath, testScript);
fs.chmodSync(testScriptPath, '755');
console.log('✅ 已创建测试脚本 test-connectivity.sh');

console.log('\n📋 修复完成！请执行以下步骤：');
console.log('1. 重启Docker服务:');
console.log('   docker-compose -f docker-compose.prod.yml down');
console.log('   docker-compose -f docker-compose.prod.yml up -d');
console.log('');
console.log('2. 运行测试脚本验证:');
console.log('   ./test-connectivity.sh');
console.log('');
console.log('3. 测试HTTP访问 (推荐):');
console.log('   curl http://8.145.34.30:3001/health');
console.log('   curl http://8.145.34.30/health');
console.log('');
console.log('⚠️  注意：暂时避免使用HTTPS访问，因为SSL证书配置不完整');