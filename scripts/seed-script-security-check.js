#!/usr/bin/env node

/**
 * Seed脚本安全检查工具
 * 专门用于检查Prisma seed脚本中的安全隐患
 */

const fs = require('fs');
const path = require('path');

async function checkSeedScriptSecurity() {
    console.log('🔍 Seed脚本安全检查\n');
    
    const seedPath = path.join(__dirname, '../backend/prisma/seed.ts');
    
    if (!fs.existsSync(seedPath)) {
        console.log('✅ Seed脚本不存在，无需检查');
        return { passed: true };
    }
    
    const content = fs.readFileSync(seedPath, 'utf8');
    const lines = content.split('\n');
    
    // 危险操作模式
    const dangerousPatterns = [
        'deleteMany()',
        'delete()',
        'truncate',
        'drop table',
        'clear',
        'reset',
        'destroy'
    ];
    
    let issues = [];
    let commentedIssues = [];
    
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        
        // 检查每种危险模式
        dangerousPatterns.forEach(pattern => {
            if (line.includes(pattern)) {
                // 检查是否被注释
                const isCommented = line.trim().startsWith('//') || 
                                  line.trim().startsWith('/*') ||
                                  line.includes('/*') && line.includes('*/');
                
                const issue = {
                    line: lineNumber,
                    pattern: pattern,
                    content: line.trim(),
                    commented: isCommented
                };
                
                if (isCommented) {
                    commentedIssues.push(issue);
                } else {
                    issues.push(issue);
                }
            }
        });
    });
    
    // 输出检查结果
    if (issues.length > 0) {
        console.log('❌ 发现未注释的危险操作:');
        issues.forEach(issue => {
            console.log(`  第${issue.line}行: ${issue.pattern}`);
            console.log(`    ${issue.content}`);
        });
        return { passed: false, issues };
    }
    
    if (commentedIssues.length > 0) {
        console.log(`✅ 检测到${commentedIssues.length}行已注释的危险操作（这是安全的）:`);
        commentedIssues.slice(0, 3).forEach(issue => {
            console.log(`  第${issue.line}行: ${issue.pattern} （已注释）`);
        });
        if (commentedIssues.length > 3) {
            console.log(`  ... 还有${commentedIssues.length - 3}行已注释的危险操作`);
        }
    } else {
        console.log('✅ 未发现任何危险操作');
    }
    
    return { passed: true };
}

// 执行检查
if (require.main === module) {
    checkSeedScriptSecurity()
        .then(result => {
            if (result.passed) {
                console.log('\n🎉 Seed脚本安全检查通过！');
                process.exit(0);
            } else {
                console.log('\n🚨 Seed脚本存在安全隐患！');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('检查执行失败:', error);
            process.exit(1);
        });
}

module.exports = { checkSeedScriptSecurity };