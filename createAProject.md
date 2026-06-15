## 创建仓库与工作区骨架
- 创建项目目录结构
```bash
mkdir tob-multi-tenant-admin
cd tob-multi-tenant-admin
pnpm init
```
- 配置工作区,创建pnpm-workspace.yaml文件
```yaml
packages:
  - "apps/*"
  - "packages/*"
```
- 创建apps/ 与 packages/ 目录
```bash
mkdir apps packages infra docs
mkdir apps/web apps/api packages/shared
```
## 根目录工程配置（脚本+ TS基础文件）
在根目录创建 tsconfig.base.json （用于全仓 TS 继承）：

- 建议包含： target 、 module 、 moduleResolution 、 strict 、 baseUrl 、 paths （可先不写 paths）
根 package.json 建议改成具备这些脚本（你手动加即可）：

- dev ：并行启动 web 与 api
- build ：分别 build
- lint / format / typecheck
根目录安装工程依赖（根装一次即可）：
```bash
pnpm add -D typescript eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier concurrently rimraf
```

## 初始化前端（apps/web）:vite+react+ts
进入web目录，用非交互方式创建vite项目
```bash
cd apps/web
pnpm create vite@latest . -- --template react-ts
pnpm install
```
安装前端依赖（React Router、Axios、Antd、Tailwind 相关）
```bash
pnpm add react-router-dom axios antd @ant-design/icons clsx tailwind-merge
pnpm add -D tailwindcss postcss autoprefixer
```
初始化 Tailwind v3 需要使用init命令
在full-stack/tob-multi-tenant-admin/apps/web目录下执行
```bash
pnpm remove tailwindcss
pnpm add -D tailwindcss@3.4.17

pnpm exec tailwindcss init -p
```
会得到 tailwind.config.* 和 postcss.config.* ，后续按 v3 的方式在 CSS 里写三行 @tailwind base; @tailwind components; @tailwind utilities; 即可

如果是V4，不再用 tailwindcss init
v4 需要用它的新插件包来接入（而不是靠 tailwindcss 这个包的 CLI）
在full-stack/tob-multi-tenant-admin/apps/web
```bash
pnpm add -D @tailwindcss/vite
```
### 修改 vite.config.ts（注册 Tailwind 插件）
把 apps/web/vite.config.ts 改成类似这样（关键是加 tailwindcss() ）
```bash
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```
CSS 入口文件顶部引入 Tailwind v4
入口是 src/index.css ，在第一行加：
```css
@import "tailwindcss";
```
## 初始化后端（apps/api）NestJS + Ts (局部)
确认在仓库根目录（tob-multi-tenant-admin）已经有Nest Cli
```bash
pnpm -C apps/api exec nest --version
```
局部启动NestJS服务
```bash
pnpm --filter api start:dev
```
或者：
```bash
pnpm -C apps/api start:dev
```
全局
```bash
nest new . --package-manager pnpm
```
```bash
pnpm add prisma @prisma/client pg ioredis
pnpm add @nestjs/config @nestjs/swagger swagger-ui-express
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt
pnpm add bcrypt
pnpm add -D @types/bcrypt
```
初始化 Prisma 数据库
```bash
pnpm dlx prisma init
```
需要手动准备：
- .env ：配置 DATABASE_URL
- prisma/schema.prisma ：先写最小模型（后续再扩展）
- NestJS 启动后加一个 health 接口（用于验收你跑通了）
验证是否后端跑通
```bash
pnpm start:dev
```

## 初始化共享包（packages/shared）：纯TS  
```bash
pnpm init
pnpm add -D typescript
```
手动创建：

- src/permissions.ts （权限点常量）
- src/error-codes.ts （错误码常量）
- src/dto/ （前后端共享 DTO 类型）
shared 包的 package.json 里建议有：

- name （例如 @repo/shared ）
- main / types 指向构建产物（初期也可先不发布，只做源码引用）

## 打通workspace引用（让web/api用shared）
回到根目录，把 shared 作为 workspace 依赖加进 web 与 api：

- 在 apps/web ：
```bash
pnpm add @repo/shared --workspace
```

- 在 apps/api ：
```bash
pnpm add @repo/shared --workspace
```
其中 @repo/shared 是 shared 包的 name。

## 基础基础设施（infra）：Postgres + Redis（Docker Compose）
在根目录 infra/docker-compose.yml 准备：

- postgres 服务（映射端口、挂载数据卷、初始化密码）
- redis 服务（映射端口）
然后在根目录起依赖：
```bash
docker compose -f infra/docker-compose.yml up -d
```
验证：

- Postgres 端口可连
- Redis 端口可连
- 后端 DATABASE_URL 指向本地 Postgres

## 根目录一键启动
回到根目录，保证你能做到：
```bash
pnpm -r dev
``` 
需要做的事情：

- 在 apps/web/package.json 里有 dev
- 在 apps/api/package.json 里有 start:dev 或 dev
- 根 package.json 的 dev 用 concurrently 并行跑两个命令