#!/usr/bin/env node

/**
 * Nginx配置验证脚本
 * 用于验证前端Docker镜像中的nginx配置是否正确
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 开始验证Nginx配置...\n');

// 检查本地配置文件
const localNginxConfig = path.join(__dirname, '../frontend/nginx/default.conf');
const localMainConfig = path.join(__dirname, '../frontend/nginx.conf');

console.log('1. 检查本地配置文件...');
if (fs.existsSync(localNginxConfig)) {
  console.log('✅ 找到 frontend/nginx/default.conf');
  const configContent = fs.readFileSync(localNginxConfig, 'utf8');
  console.log(`   文件大小: ${configContent.length} 字符`);
  
  // 检查关键配置项
  if (configContent.includes('location /api/')) {
    console.log('✅ 包含API代理配置');
  } else {
    console.log('❌ 缺少API代理配置');
  }
  
  if (configContent.includes('try_files $uri $uri/ /index.html')) {
    console.log('✅ 包含SPA路由配置');
  } else {
    console.log('❌ 缺少SPA路由配置');
  }
} else {
  console.log('❌ 未找到 frontend/nginx/default.conf');
}

if (fs.existsSync(localMainConfig)) {
  console.log('✅ 找到 frontend/nginx.conf');
} else {
  console.log('❌ 未找到 frontend/nginx.conf');
}

console.log('\n2. 检查Dockerfile配置...');
const dockerfilePath = path.join(__dirname, '../frontend/Dockerfile');
if (fs.existsSync(dockerfilePath)) {
  const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
  if (dockerfileContent.includes('COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf')) {
    console.log('✅ Dockerfile正确配置了nginx配置文件复制');
  } else {
    console.log('❌ Dockerfile缺少nginx配置文件复制指令');
  }
  
  if (dockerfileContent.includes('COPY --from=build /app/dist /usr/share/nginx/html')) {
    console.log('✅ Dockerfile正确配置了静态文件复制');
  } else {
    console.log('❌ Dockerfile缺少静态文件复制指令');
  }
}

console.log('\n3. 检查docker-compose配置...');
const composePath = path.join(__dirname, '../docker-compose.yml');
if (fs.existsSync(composePath)) {
  const composeContent = fs.readFileSync(composePath, 'utf8');
  if (composeContent.includes('./frontend/nginx/nginx.conf:/etc/nginx/nginx.conf')) {
    console.log('⚠️  docker-compose引用了可能不存在的nginx.conf文件');
  }
  
  if (composeContent.includes('ports:') && composeContent.includes('- "80:80"')) {
    console.log('✅ docker-compose正确配置了端口映射');
  }
}

console.log('\n4. 【可选】构建测试镜像验证配置...');
try {
  console.log('正在构建测试镜像...');
  execSync('cd frontend && docker build -t nginx-test .', { 
    stdio: 'inherit',
    timeout: 300000 // 5分钟超时
  });
  
  console.log('✅ 镜像构建成功');
  
  // 启动测试容器
  console.log('启动测试容器...');
  execSync('docker run -d --name nginx-test-container -p 8080:80 nginx-test', {
    stdio: 'inherit'
  });
  
  // 验证配置
  console.log('验证nginx配置...');
  const configCheck = execSync('docker exec nginx-test-container nginx -t', {
    encoding: 'utf8'
  });
  console.log('✅ Nginx配置语法正确');
  
  // 检查配置文件内容
  console.log('检查配置文件内容...');
  const configFile = execSync('docker exec nginx-test-container cat /etc/nginx/conf.d/default.conf', {
    encoding: 'utf8'
  });
  console.log('配置文件前20行:');
  console.log(configFile.split('\n').slice(0, 20).join('\n'));
  
  // 清理测试容器
  console.log('清理测试环境...');
  execSync('docker stop nginx-test-container && docker rm nginx-test-container', {
    stdio: 'inherit'
  });
  
} catch (error) {
  console.error('❌ 验证过程中出现错误:', error.message);
  try {
    execSync('docker stop nginx-test-container 2>/dev/null || true');
    execSync('docker rm nginx-test-container 2>/dev/null || true');
  } catch (cleanupError) {
    // 忽略清理错误
  }
}

console.log('\n🎉 Nginx配置验证完成！');