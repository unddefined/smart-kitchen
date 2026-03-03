# =========================
# Build stage
# =========================
FROM node:24-alpine AS builder

WORKDIR /app

# 仅复制依赖文件（最大化缓存命中）
COPY package.json package-lock.json ./

# 启用 npm cache mount（必须配合 buildx）
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# 复制 prisma 和 tsconfig
COPY prisma ./prisma
COPY tsconfig*.json ./
COPY prisma.config.ts ./

# 生成 Prisma Client
RUN npx prisma generate

# 复制源码
COPY . .

# 构建
RUN npm run build

# =========================
# Production stage
# =========================
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# 只复制必要文件
COPY package.json package-lock.json ./

# 直接从 builder 复制已经优化过的 node_modules
COPY --from=builder /app/node_modules ./node_modules

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["node", "dist/src/main.js"]