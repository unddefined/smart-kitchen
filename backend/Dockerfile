# 构建阶段
FROM node:25-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 1. 安装依赖
RUN npm ci 

# 2. 【新增】生成 Prisma 客户端 (必须在编译前执行)
# 确保此时 schema.prisma 已经复制到容器中
RUN npx prisma generate

# 3. 复制源代码 (如果之前没复制全)确保这步在 generate 之前或者 generate 能访问到 schema
COPY . .

# 4. 编译 TypeScript
RUN npm run build

# 5. (可选) 清理缓存
RUN npm cache clean --force

# 生产阶段
FROM node:25-alpine AS production

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 复制构建产物和依赖
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
# 复制Prisma相关文件
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# 启动应用
CMD ["node", "dist/src/main"]
