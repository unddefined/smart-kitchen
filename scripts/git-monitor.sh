#!/bin/bash

# Git状态监控脚本
# 用于监控项目Git状态和自动提醒

PROJECT_DIR="/root/smart-kitchen"
LOG_FILE="/root/log/git-monitor.log"

echo "[$(date)] 开始Git状态检查..." >> $LOG_FILE

# 检查项目目录
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ 项目目录不存在: $PROJECT_DIR" >> $LOG_FILE
    exit 1
fi

cd $PROJECT_DIR

# 检查Git状态
STATUS_OUTPUT=$(git status --porcelain)
if [ -n "$STATUS_OUTPUT" ]; then
    echo "⚠️  发现未提交的更改:" >> $LOG_FILE
    echo "$STATUS_OUTPUT" >> $LOG_FILE
    
    # 发送告警（可根据需要配置邮件或消息通知）
    echo "Git状态异常，请检查服务器" | mail -s "Git监控告警" admin@example.com
fi

# 检查远程更新
LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git ls-remote origin main | cut -f1)

if [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
    echo "🔄 检测到远程有更新，准备自动拉取..." >> $LOG_FILE
    git pull origin main
    echo "✅ 自动更新完成" >> $LOG_FILE
    
    # 触发部署
    $PROJECT_DIR/deploy.sh
fi

# 清理过期的日志
find /root/log -name "git-monitor.log*" -mtime +30 -delete

echo "[$(date)] Git状态检查完成" >> $LOG_FILE