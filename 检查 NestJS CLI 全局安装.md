# 检查 NestJS CLI 全局安装

> **Workspace:** e:\full-stack

---

**User**

检查当前电脑是否全局安装nestjs cli

**Assistant**

我先在终端里检查全局 `npm` 包和 `nest` 命令是否存在，这样能确认 `@nestjs/cli` 是否已全局安装。

已检查，当前电脑**已全局安装** `NestJS CLI`。

- 全局包：`@nestjs/cli@11.0.14`
- 全局安装位置：`F:\nodejs\node_global`

如果你愿意，我也可以继续帮你检查 `nest --version` 或确认 `nest` 命令是否已加入 `PATH`。

---

**User**

在全栈开发知识体系导图.md文件中，我已经依次做到了5）初始化共享包。但是我并不知道手动创建的src目录下的文件需要填充哪些内容。麻烦给出后续的开发代码和继续5之后一直到9的具体代码内容。不需要直接动项目代码。我希望你给出一步步引导。我自己来完成代码的书写。因为我想要手写代码一直到上线完成

**Assistant**

我先读取你提到的 `全栈开发知识体系导图.md`，确认第 `5` 到 `9` 步的上下文，再按你的项目结构给出可手写的分步代码模板和说明。

我已经定位到导图文件和你的 monorepo 目录，接下来会对照 `packages/shared/src` 的现有文件和文档里的 `5-9` 步，给你一份能直接照着手写的路线。

我确认了：你现在 `packages/shared/src/error-codes.ts` 和 `permissions.ts` 还是空文件，所以你卡住的点正是“第 5 步该往共享包里写什么”。我接下来会直接按你当前仓库给出可手写版本，包括 `shared` 里的最小代码、以及第 `6-9` 步要继续写到什么程度。

我已经把你的当前状态对上了：`shared` 里只有空文件，`tsconfig.base.json` 还是空的，`Prisma` 也还只是默认模板。下面我会直接给你“照着写”的最小可运行版本，优先保证你能从第 `5` 步平滑推进到第 `9` 步。

**当前判断**
- 你现在卡住很正常，因为这几个关键文件还没有“最小可运行内容”：[error-codes.ts](file:///e:/full-stack/tob-multi-tenant-admin/packages/shared/src/error-codes.ts)、[permissions.ts](file:///e:/full-stack/tob-multi-tenant-admin/packages/shared/src/permissions.ts)、[tsconfig.base.json](file:///e:/full-stack/tob-multi-tenant-admin/tsconfig.base.json)、[schema.prisma](file:///e:/full-stack/tob-multi-tenant-admin/apps/api/prisma/schema.prisma)。
- 当前前端还是 Vite 默认页：[App.tsx](file:///e:/full-stack/tob-multi-tenant-admin/apps/web/src/App.tsx)，后端还是 Nest 默认 hello world：[main.ts](file:///e:/full-stack/tob-multi-tenant-admin/apps/api/src/main.ts)。
- 所以你现在最合理的目标不是马上做登录和 RBAC，而是先把“`shared -> api -> web` 最小闭环”手写跑通。

**先说结论**
- 第 `5` 步你要写的是“共享常量、共享类型、共享导出”。
- 第 `6` 步你要写的是“workspace 根脚本 + shared 包构建配置”。
- 第 `7` 步你要写的是“Docker + Prisma 最小数据库模型”。
- 第 `8` 步你要写的是“后端健康检查 + Swagger + 前端联调页”。
- 第 `9` 步你要做的是“按验收点逐项跑通”。

**第 5 步**
- 目标：让 `packages/shared` 先成为一个真正可被前后端复用的小包。
- 你现在至少要补 4 个文件：`permissions.ts`、`error-codes.ts`、`dto/common.ts`、`index.ts`。
- 另外再补 2 个配置文件：`packages/shared/package.json`、`packages/shared/tsconfig.json`。

先创建目录：`packages/shared/src/dto`

然后手写 [permissions.ts](file:///e:/full-stack/tob-multi-tenant-admin/packages/shared/src/permissions.ts)：

```ts
export const PERMISSION_CODES = {
  PLATFORM_TENANT_READ: 'platform.tenant.read',
  PLATFORM_TENANT_CREATE: 'platform.tenant.create',
  PLATFORM_TENANT_UPDATE: 'platform.tenant.update',

  TENANT_USER_READ: 'tenant.user.read',
  TENANT_USER_CREATE: 'tenant.user.create',
  TENANT_USER_UPDATE: 'tenant.user.update',

  ROLE_READ: 'role.read',
  ROLE_CREATE: 'role.create',
  ROLE_UPDATE: 'role.update',

  AUDIT_LOG_READ: 'audit-log.read',

  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update',
} as const;

export type PermissionCode =
  (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES];

export const ALL_PERMISSION_CODES: PermissionCode[] = Object.values(
  PERMISSION_CODES,
);

export const DEFAULT_TENANT_ADMIN_PERMISSIONS: PermissionCode[] = [
  PERMISSION_CODES.TENANT_USER_READ,
  PERMISSION_CODES.TENANT_USER_CREATE,
  PERMISSION_CODES.TENANT_USER_UPDATE,
  PERMISSION_CODES.ROLE_READ,
  PERMISSION_CODES.ROLE_CREATE,
  PERMISSION_CODES.ROLE_UPDATE,
  PERMISSION_CODES.AUDIT_LOG_READ,
  PERMISSION_CODES.SETTINGS_READ,
  PERMISSION_CODES.SETTINGS_UPDATE,
];
```

再手写 [error-codes.ts](file:///e:/full-stack/tob-multi-tenant-admin/packages/shared/src/error-codes.ts)：

```ts
export const ERROR_CODES = {
  OK: 'OK',

  COMMON_BAD_REQUEST: 'COMMON_BAD_REQUEST',
  COMMON_UNAUTHORIZED: 'COMMON_UNAUTHORIZED',
  COMMON_FORBIDDEN: 'COMMON_FORBIDDEN',
  COMMON_NOT_FOUND: 'COMMON_NOT_FOUND',
  COMMON_INTERNAL_ERROR: 'COMMON_INTERNAL_ERROR',

  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_OTP_INVALID: 'AUTH_OTP_INVALID',

  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  TENANT_ACCESS_DENIED: 'TENANT_ACCESS_DENIED',

  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ROLE_NOT_FOUND: 'ROLE_NOT_FOUND',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface ApiErrorBody {
  code: ErrorCode;
  message: string;
  requestId?: string;
  details?: unknown;
}
```

再创建并手写 `packages/shared/src/dto/common.ts`：

```ts
export interface ApiSuccessResponse<T> {
  code: 'OK';
  message: string;
  data: T;
}

export interface PageQuery {
  page: number;
  pageSize: number;
  keyword?: string;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface HealthData {
  service: string;
  status: 'ok';
  timestamp: string;
}

export type HealthResponse = ApiSuccessResponse<HealthData>;
```

再创建 `packages/shared/src/index.ts`：

```ts
export * from './permissions';
export * from './error-codes';
export * from './dto/common';
```

再把 [packages/shared/package.json](file:///e:/full-stack/tob-multi-tenant-admin/packages/shared/package.json) 改成下面这样：

```json
{
  "name": "@repo/shared",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsc -p tsconfig.json --watch"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

再创建 `packages/shared/tsconfig.json`：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "rootDir": "./src",
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "strict": true
  },
  "include": ["src/**/*.ts"]
}
```

**第 5 步为什么要这样写**
- `permissions.ts` 是未来前后端共同使用的权限码来源。
- `error-codes.ts` 是以后统一错误响应的基础。
- `dto/common.ts` 是最早能复用起来的共享类型。
- `index.ts` 是统一出口，不然你后面导入会很乱。
- `package.json + tsconfig.json` 是让这个包真的能 build，而不是只有源码。

**第 6 步**
- 目标：让根目录能统一启动整个 monorepo。
- 这一步最关键的是 [tsconfig.base.json](file:///e:/full-stack/tob-multi-tenant-admin/tsconfig.base.json) 和根 [package.json](file:///e:/full-stack/tob-multi-tenant-admin/package.json)。

先把 [tsconfig.base.json](file:///e:/full-stack/tob-multi-tenant-admin/tsconfig.base.json) 写成最小公共配置：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

再把根 [package.json](file:///e:/full-stack/tob-multi-tenant-admin/package.json) 改成这种最小可用版：

```json
{
  "name": "tob-multi-tenant-admin",
  "private": true,
  "version": "1.0.0",
  "packageManager": "pnpm@10.28.2",
  "scripts": {
    "dev": "concurrently -n shared,api,web \"pnpm --filter @repo/shared dev\" \"pnpm --filter api start:dev\" \"pnpm --filter web dev\"",
    "build": "pnpm --filter @repo/shared build && pnpm --filter api build && pnpm --filter web build",
    "lint": "pnpm --filter api lint && pnpm --filter web lint"
  },
  "devDependencies": {
    "concurrently": "^9.2.1",
    "typescript": "^5.7.3"
  }
}
```

然后你执行这两条命令：

```bash
pnpm install
pnpm --filter @repo/shared build
```

**第 6 步验收点**
- `packages/shared/dist` 被成功生成。
- 前后端后面都可以从 `@repo/shared` 导入东西。
- 根目录执行 `pnpm dev` 时，理论上会同时起 `shared`、`api`、`web`。

**第 7 步**
- 目标：先把数据库和缓存基础设施准备好，再把 Prisma 最小模型写出来。
- 你现在不用一开始就上完整 RBAC 表，只需要先把 `Tenant`、`User`、`TenantUser` 跑起来。

先创建 `infra/docker-compose.yml`：

```yaml
services:
  postgres:
    image: postgres:16
    container_name: tob_admin_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: tob_admin
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    container_name: tob_admin_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

再创建 `apps/api/.env`：

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tob_admin?schema=public"
REDIS_URL="redis://localhost:6379"
```

再把 [schema.prisma](file:///e:/full-stack/tob-multi-tenant-admin/apps/api/prisma/schema.prisma) 整个替换成下面这个最小版：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Tenant {
  id        String       @id @default(cuid())
  name      String
  status    TenantStatus @default(ACTIVE)
  createdAt DateTime     @default(now()) @map("created_at")
  updatedAt DateTime     @updatedAt @map("updated_at")
  members   TenantUser[]

  @@map("tenants")
}

model User {
  id           String       @id @default(cuid())
  email        String?      @unique
  phone        String?      @unique
  passwordHash String?      @map("password_hash")
  status       UserStatus   @default(ACTIVE)
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")
  tenants      TenantUser[]

  @@map("users")
}

model TenantUser {
  id          String           @id @default(cuid())
  tenantId    String           @map("tenant_id")
  userId      String           @map("user_id")
  displayName String           @map("display_name")
  status      TenantUserStatus @default(ACTIVE)
  createdAt   DateTime         @default(now()) @map("created_at")
  updatedAt   DateTime         @updatedAt @map("updated_at")
  tenant      Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([tenantId, userId])
  @@index([tenantId])
  @@index([userId])
  @@map("tenant_users")
}

enum TenantStatus {
  ACTIVE
  DISABLED
}

enum UserStatus {
  ACTIVE
  DISABLED
}

enum TenantUserStatus {
  ACTIVE
  DISABLED
}
```

然后按顺序执行：

```bash
docker compose -f infra/docker-compose.yml up -d
pnpm --filter api exec prisma generate
pnpm --filter api exec prisma db push
```

**第 7 步验收点**
- Docker 里 `postgres` 和 `redis` 都起来了。
- `prisma generate` 成功。
- `prisma db push` 成功。
- 数据库里已经有 `tenants`、`users`、`tenant_users` 三张表。

**第 8 步**
- 目标：让后端提供 `/api/health` 和 `/docs`，前端页面能把健康检查结果显示出来。
- 这是你从“搭骨架”进入“真正联调”的第一步。

先把 [apps/api/src/main.ts](file:///e:/full-stack/tob-multi-tenant-admin/apps/api/src/main.ts) 改成下面这样：

```ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('ToB Multi Tenant Admin API')
    .setDescription('ToB 多租户后台接口文档')
    .setVersion('0.1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
```

再把 [app.module.ts](file:///e:/full-stack/tob-multi-tenant-admin/apps/api/src/app.module.ts) 改成：

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

再把 [app.service.ts](file:///e:/full-stack/tob-multi-tenant-admin/apps/api/src/app.service.ts) 改成：

```ts
import { Injectable } from '@nestjs/common';
import { ERROR_CODES, type HealthResponse } from '@repo/shared';

@Injectable()
export class AppService {
  getHealth(): HealthResponse {
    return {
      code: ERROR_CODES.OK,
      message: 'service is running',
      data: {
        service: 'api',
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
```

再把 [app.controller.ts](file:///e:/full-stack/tob-multi-tenant-admin/apps/api/src/app.controller.ts) 改成：

```ts
import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@repo/shared';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth(): HealthResponse {
    return this.appService.getHealth();
  }
}
```

再把 [vite.config.ts](file:///e:/full-stack/tob-multi-tenant-admin/apps/web/vite.config.ts) 改成：

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

再把 [main.tsx](file:///e:/full-stack/tob-multi-tenant-admin/apps/web/src/main.tsx) 改成：

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'antd/dist/reset.css';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

再把 [index.css](file:///e:/full-stack/tob-multi-tenant-admin/apps/web/src/index.css) 改成最小版：

```css
@import "tailwindcss";

html,
body,
#root {
  min-height: 100%;
}

body {
  margin: 0;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  background: #f8fafc;
}
```

最后把 [App.tsx](file:///e:/full-stack/tob-multi-tenant-admin/apps/web/src/App.tsx) 改成这个“最小联调页”：

```tsx
import { Card, Spin, Tag, Typography } from 'antd';
import axios from 'axios';
import { useEffect, useState } from 'react';
import type { HealthResponse } from '@repo/shared';

const { Title, Paragraph, Text } = Typography;

function App() {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const { data } = await axios.get<HealthResponse>('/api/health');
        setHealth(data);
      } catch {
        setError('后端健康检查失败，请确认 api 已启动。');
      } finally {
        setLoading(false);
      }
    };

    void loadHealth();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <Title level={2}>ToB 多租户后台</Title>
        <Paragraph>
          当前阶段目标：先跑通 shared、api、web 的最小闭环。
        </Paragraph>

        <Card className="shadow-sm">
          {loading ? (
            <Spin />
          ) : error ? (
            <Tag color="error">{error}</Tag>
          ) : (
            <>
              <Paragraph>
                API 状态：<Tag color="success">{health?.data.status}</Tag>
              </Paragraph>
              <Paragraph>
                服务名称：<Text code>{health?.data.service}</Text>
              </Paragraph>
              <Paragraph>
                时间戳：<Text code>{health?.data.timestamp}</Text>
              </Paragraph>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}

export default App;
```

**第 8 步验收点**
- 打开 [http://localhost:3000/api/health](http://localhost:3000/api/health) 能返回 JSON。
- 打开 [http://localhost:3000/docs](http://localhost:3000/docs) 能看到 Swagger。
- 打开 [http://localhost:5173](http://localhost:5173) 能看到前端页面，并显示后端状态。

**第 9 步**
- 目标：你要学会像工程师一样验收，不是“代码写完就结束”。
- 这一步不要写新业务，只做检查。

你按这个顺序执行：

```bash
pnpm install
pnpm --filter @repo/shared build
docker compose -f infra/docker-compose.yml up -d
pnpm --filter api exec prisma generate
pnpm --filter api exec prisma db push
pnpm dev
```

你要逐项确认：
- `shared` 能 build。
- `api` 启动不报错。
- `web` 启动不报错。
- `http://localhost:3000/api/health` 正常。
- `http://localhost:3000/docs` 正常。
- `http://localhost:5173` 正常。
- 前端页面上能显示从后端取回来的健康状态。

**你现在最容易踩的坑**
- `@repo/shared` 改了源码以后，如果 `dist` 没更新，前后端可能读到旧内容。
- Prisma 如果没读到 `DATABASE_URL`，通常是 `apps/api/.env` 没放对位置。
- 前端如果请求失败，先查 `vite.config.ts` 里的 `/api` 代理，再查 Nest 的 `app.setGlobalPrefix('api')`。
- 如果 `App.tsx` 还保留 Vite 默认的 logo 和 `App.css` 逻辑，页面会混乱，所以建议你这一步直接把默认示例替掉。

**推荐你的执行顺序**
- 先只完成第 `5` 步，然后执行 `pnpm --filter @repo/shared build`。
- 再完成第 `6` 步，确认根脚本可用。
- 再完成第 `7` 步，把数据库和 Redis 跑起来。
- 最后完成第 `8` 步和第 `9` 步的联调验收。

**下一步**
- 你把第 `5` 步手写完后，把这 4 个文件发我：
  - [packages/shared/package.json](file:///e:/full-stack/tob-multi-tenant-admin/packages/shared/package.json)
  - [packages/shared/tsconfig.json](file:///e:/full-stack/tob-multi-tenant-admin/packages/shared/tsconfig.json)
  - [permissions.ts](file:///e:/full-stack/tob-multi-tenant-admin/packages/shared/src/permissions.ts)
  - [error-codes.ts](file:///e:/full-stack/tob-multi-tenant-admin/packages/shared/src/error-codes.ts)
- 我可以继续按你的手写节奏，帮你做“第 `5` 步代码 review”，确认没问题后再带你进入 Auth 模块的第 `10` 步。

---

