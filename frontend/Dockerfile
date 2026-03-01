# 构建阶段
FROM node:22-alpine AS build

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖用于构建）
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制 nginx 配置
COPY ../nginx/default.conf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=build /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]