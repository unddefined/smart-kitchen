# =========================
# Build stage
# =========================
FROM node:24-alpine AS build

WORKDIR /app

# 只复制依赖文件（最大化缓存命中）
COPY package.json package-lock.json ./

# 使用 BuildKit 缓存 npm
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# 再复制源码
COPY . .

# 构建
RUN npm run build

# =========================
# Production stage
# =========================
FROM nginx

# 复制 nginx 配置
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]