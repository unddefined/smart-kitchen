#!/usr/bin/env node

/**
 * 部署状态监控脚本
 * 用于检查服务健康状态和部署完整性
 */

const https = require('https');
const http = require('http');

// 配置
const CONFIG = {
  services: [
    {
      name: 'Frontend',
      url: 'http://localhost',
      expectedStatus: 200,
      timeout: 5000
    },
    {
      name: 'Backend API',
      url: 'http://localhost:3001/api/health',
      expectedStatus: 200,
      timeout: 5000
    },
    {
      name: 'Database',
      url: 'http://localhost:3001/api/dishes',
      expectedStatus: 200,
      timeout: 10000
    }
  ],
  maxRetries: 3,
  retryDelay: 2000
};

async function checkService(service) {
  return new Promise((resolve) => {
    const url = new URL(service.url);
    const client = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      timeout: service.timeout
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          name: service.name,
          status: 'success',
          statusCode: res.statusCode,
          responseTime: Date.now() - startTime,
          data: data.substring(0, 200) // 限制响应数据长度
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        name: service.name,
        status: 'error',
        error: error.message,
        responseTime: Date.now() - startTime
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: service.name,
        status: 'timeout',
        responseTime: service.timeout
      });
    });

    const startTime = Date.now();
    req.end();
  });
}

async function runHealthCheck() {
  console.log('🔍 开始部署健康检查...');
  console.log(`检查时间: ${new Date().toISOString()}`);
  console.log('='.repeat(50));

  const results = [];
  
  for (const service of CONFIG.services) {
    console.log(`\n🧪 检查 ${service.name}...`);
    
    let result;
    let retries = 0;
    
    do {
      result = await checkService(service);
      
      if (result.status === 'success') {
        console.log(`✅ ${service.name}: 正常 (状态码: ${result.statusCode}, 响应时间: ${result.responseTime}ms)`);
        break;
      } else {
        retries++;
        console.log(`⚠️  ${service.name}: ${result.status} (${retries}/${CONFIG.maxRetries})`);
        if (retries < CONFIG.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
        }
      }
    } while (retries < CONFIG.maxRetries);
    
    if (result.status !== 'success' && retries >= CONFIG.maxRetries) {
      console.log(`❌ ${service.name}: 持续失败`);
    }
    
    results.push(result);
  }

  // 汇总结果
  console.log('\n' + '='.repeat(50));
  console.log('📊 检查汇总:');
  
  const successCount = results.filter(r => r.status === 'success').length;
  const totalCount = results.length;
  
  console.log(`总服务数: ${totalCount}`);
  console.log(`正常服务: ${successCount}`);
  console.log(`异常服务: ${totalCount - successCount}`);
  
  if (successCount === totalCount) {
    console.log('🎉 所有服务正常运行！');
    process.exit(0);
  } else {
    console.log('⚠️  部分服务存在问题，请检查日志');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runHealthCheck().catch(error => {
    console.error('❌ 监控脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { runHealthCheck, CONFIG };