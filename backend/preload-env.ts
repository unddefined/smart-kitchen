/**
 * 环境变量预加载脚本
 * 在 NestJS 启动前展开所有环境变量引用
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
console.log('[Preload] Loading environment from:', envPath);

const dotenvResult = dotenv.config({ path: envPath });

if (dotenvResult.parsed) {
  // 展开变量引用
  Object.keys(dotenvResult.parsed).forEach((key) => {
    let value = dotenvResult.parsed[key] || '';
    let iterations = 0;
    
    while (value.includes('${') && iterations < 10) {
      const newValue = value.replace(/\$\{([^}]+)\}/g, (_, varName) => {
        return process.env[varName] || dotenvResult.parsed?.[varName] || '';
      });
      
      if (newValue === value) break;
      value = newValue;
      iterations++;
    }
    
    dotenvResult.parsed[key] = value;
    process.env[key] = value;
  });
  
  console.log('[Preload] Expanded variables:', Object.keys(dotenvResult.parsed).length);
  console.log('[Preload] DATABASE_URL configured:', !!process.env.DATABASE_URL);
} else {
  console.warn('[Preload] No environment variables loaded');
}
