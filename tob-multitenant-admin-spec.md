# ToB 多租户后台作品：实施规格（React + NestJS + PostgreSQL）

本规格用于把项目从“清单”落到“可直接开工”的层面：明确模块边界、权限点种子、接口 DTO、表结构（Prisma schema 草案）、前端路由与验收标准。

---

## 1. 总体架构（单体 + 模块化）

- 形态：Modular Monolith（模块化单体）
- 多租户：共享库共享表 + `tenant_id`
- 租户识别：登录后选择租户（accessToken 内携带 `tenantId`）
- 鉴权
  - accessToken：短时效（例如 15–30min）
  - refreshToken：长时效（例如 7–30d），可撤销（落库存 hash）
- 登录方式
  - 邮箱 + 密码
  - 手机号 + OTP（验证码存 Redis，带发送频控）

---

## 2. 权限模型（RBAC）与权限点种子（建议直接照此 seed）

### 2.1 权限模块分组

- Auth：仅鉴权不单独做权限点（通常由登录态决定）
- Tenant（租户域）：成员管理
- RBAC：角色与授权
- Audit：审计日志查询
- Settings：租户配置
- Platform：平台超管（跨租户）

### 2.2 Permission seed（code 建议风格：`module.action`）

#### Tenant

- `tenantUser.read`
- `tenantUser.create`
- `tenantUser.update`
- `tenantUser.disable`

#### RBAC

- `permission.read`
- `role.read`
- `role.create`
- `role.update`
- `role.disable`
- `role.grant`

#### Audit

- `audit.read`

#### Settings

- `settings.read`
- `settings.update`

#### Platform（超管专用）

- `platformTenant.read`
- `platformTenant.create`
- `platformTenant.update`
- `platformTenant.disable`

---

## 3. API 与 DTO（契约草案）

约定：
- 所有响应包含 `requestId`
- 错误使用统一错误码（例如：`AUTH_INVALID_CREDENTIALS`、`RBAC_FORBIDDEN`、`TENANT_NOT_FOUND`）
- 分页统一：`page`、`pageSize`，响应 `total`、`items`

### 3.1 Auth

#### POST /auth/login/password

Request
- `email: string`
- `password: string`

Response（未选择租户前）
- `accessToken: string`（不带 tenantId）
- `refreshToken: string`

#### POST /auth/otp/send

用途：给手机号发送 OTP（也可扩展邮箱 OTP）

Request
- `channel: 'sms' | 'email'`
- `phone?: string`
- `email?: string`
- `purpose: 'login'`

Response
- `cooldownSeconds: number`

安全要求
- 频控：IP 维度、手机号/邮箱维度（Redis）
- 验证码：只存 hash（可选），或直接存明文但短 TTL 且严禁日志

#### POST /auth/login/otp

Request
- `phone: string`
- `otp: string`

Response（未选择租户前）
- `accessToken: string`（不带 tenantId）
- `refreshToken: string`

#### GET /auth/tenants

Response
- `items: Array<{ tenantId: string; tenantName: string; status: 'active' | 'disabled' }>`

#### POST /auth/switch-tenant

Request
- `tenantId: string`

Response（进入租户后）
- `accessToken: string`（携带 tenantId）
- `tenant: { id: string; name: string }`
- `tenantUser: { id: string; displayName: string }`

#### GET /auth/me

Response
- `user: { id: string; email?: string; phone?: string }`
- `tenant?: { id: string; name: string }`
- `tenantUser?: { id: string; displayName: string }`
- `permissions: string[]`（进入租户后返回；未进入租户可返回空数组）

#### POST /auth/refresh

Request
- `refreshToken: string`

Response
- `accessToken: string`
- `refreshToken: string`（可旋转）

#### POST /auth/logout

Request
- `refreshToken: string`

Response
- `ok: true`

### 3.2 Tenant Users（租户内）

#### GET /tenant/users

Query
- `page: number`
- `pageSize: number`
- `keyword?: string`

Response
- `total: number`
- `items: Array<{ id: string; displayName: string; status: string; user: { email?: string; phone?: string } }>`

#### POST /tenant/users

用途：作品版建议先做“创建成员（绑定已有 user 或新建 user）”，邀请可后续加。

Request（建议两种方式二选一）
- `mode: 'createUser' | 'bindExistingUser'`
- `displayName: string`
- `email?: string`
- `phone?: string`
- `password?: string`（createUser 时可选，仅邮箱密码用户需要）
- `userId?: string`（bindExistingUser 时使用）

Response
- `id: string`

#### PATCH /tenant/users/:id

Request（按需）
- `displayName?: string`
- `status?: 'active' | 'disabled'`

Response
- `ok: true`

### 3.3 RBAC（租户内）

#### GET /permissions

Response
- `items: Array<{ id: string; code: string; name: string; module: string }>`

#### POST /roles

Request
- `name: string`
- `code: string`

#### PUT /roles/:id/permissions

Request
- `permissionIds: string[]`

#### PUT /tenant-users/:id/roles

Request
- `roleIds: string[]`

### 3.4 Audit（租户内）

#### GET /audit-logs

Query（按需）
- `page: number`
- `pageSize: number`
- `action?: string`
- `resourceType?: string`
- `actorTenantUserId?: string`
- `from?: string`（ISO）
- `to?: string`（ISO）

Response
- `total: number`
- `items: Array<{ id: string; action: string; resourceType: string; resourceId?: string; actorTenantUserId?: string; createdAt: string }>`

### 3.5 Settings（租户内）

#### GET /settings

Response
- `items: Array<{ key: string; value: unknown }>`

#### PUT /settings

Request
- `items: Array<{ key: string; value: unknown }>`

---

## 4. 后端实现要点（关键机制清单）

### 4.1 Request Context（必须）

- 每个请求建立上下文：
  - `requestId`
  - `userId`（从 token 解出）
  - `tenantId`（进入租户后从 token 解出）
  - `tenantUserId`（进入租户后查出或 token 携带）
- 需要一个统一的获取入口，避免在业务代码里到处解析 token

### 4.2 Tenant Guard（必须）

- 对租户内接口要求：
  - 必须有 `tenantId`
  - 必须存在 `tenant_user` 关系，且状态为 active

### 4.3 Permission Guard（必须）

- Controller 上声明需要的 permission code（例如 `@RequirePermissions('role.grant')`）
- Guard 读取当前 tenantUser 的 permissions，校验通过才放行

### 4.4 审计日志（必须）

- 建议记录范围：所有写接口（POST/PUT/PATCH/DELETE）
- 记录字段：actor、tenantId、action、resourceType、resourceId、before/after（JSON）

---

## 5. Prisma schema（草案，可直接作为起步版本）

说明：以下 schema 是结构草案，实际落地时按 NestJS + Prisma 的工程约定拆分 migration 与 seed。

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum TenantStatus {
  active
  disabled
}

enum UserStatus {
  active
  disabled
}

enum TenantUserStatus {
  active
  disabled
}

model Tenant {
  id        String        @id @default(uuid())
  name      String
  status    TenantStatus  @default(active)
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  tenantUsers TenantUser[]
  roles       Role[]
  settings    TenantSetting[]

  @@index([status])
}

model User {
  id           String     @id @default(uuid())
  email        String?    @unique
  phone        String?    @unique
  passwordHash String?
  status       UserStatus @default(active)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  tenantUsers   TenantUser[]
  refreshTokens RefreshToken[]

  @@index([status])
}

model TenantUser {
  id          String          @id @default(uuid())
  tenantId    String
  userId      String
  displayName String
  status      TenantUserStatus @default(active)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  roles       TenantUserRole[]
  auditAsActor AuditLog[] @relation("AuditActor")

  @@unique([tenantId, userId])
  @@index([tenantId, status])
}

model Permission {
  id     String @id @default(uuid())
  code   String @unique
  name   String
  module String

  rolePermissions RolePermission[]
}

model Role {
  id        String   @id @default(uuid())
  tenantId  String
  name      String
  code      String
  disabled  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  rolePermissions RolePermission[]
  tenantUserRoles TenantUserRole[]

  @@unique([tenantId, code])
  @@index([tenantId, disabled])
}

model RolePermission {
  id           String @id @default(uuid())
  roleId       String
  permissionId String

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
}

model TenantUserRole {
  id           String @id @default(uuid())
  tenantUserId String
  roleId       String

  tenantUser TenantUser @relation(fields: [tenantUserId], references: [id], onDelete: Cascade)
  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([tenantUserId, roleId])
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  tokenHash String
  expiresAt DateTime
  revokedAt DateTime?
  deviceInfo String?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

model LoginLog {
  id        String   @id @default(uuid())
  userId    String?
  tenantId  String?
  ip        String?
  ua        String?
  result    String
  createdAt DateTime @default(now())
}

model AuditLog {
  id                String   @id @default(uuid())
  tenantId          String
  actorTenantUserId String?
  action            String
  resourceType      String
  resourceId        String?
  before            Json?
  after             Json?
  ip                String?
  createdAt         DateTime @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  actor  TenantUser? @relation("AuditActor", fields: [actorTenantUserId], references: [id], onDelete: SetNull)

  @@index([tenantId, createdAt])
  @@index([tenantId, resourceType])
}

model TenantSetting {
  id        String   @id @default(uuid())
  tenantId  String
  key       String
  valueJson Json
  updatedAt DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, key])
}
```

---

## 6. 前端（React 管理端）路由与页面权限

### 6.1 路由建议

- `/login`
- `/select-tenant`
- `/app`
  - `/app/users`（成员管理）
  - `/app/roles`（角色管理）
  - `/app/permissions`（权限点只读）
  - `/app/audit-logs`（审计日志）
  - `/app/settings`（租户配置）
  - `/app/platform/tenants`（平台超管隐藏入口）

### 6.2 页面权限映射（建议）

- 成员管理页：`tenantUser.read`（读）、`tenantUser.create`/`tenantUser.update`/`tenantUser.disable`（写）
- 角色管理页：`role.read`、`role.create`、`role.update`、`role.disable`、`role.grant`
- 权限点页：`permission.read`
- 审计日志页：`audit.read`
- 配置页：`settings.read`、`settings.update`

---

## 7. 第一周开工顺序（按最短闭环）

- Day 1：NestJS + Prisma + Postgres + Redis + Swagger 跑通；完成 migration/seed 框架
- Day 2：邮箱密码登录 + refreshToken 落库；`/auth/me`
- Day 3：手机号 OTP 发送与登录（Redis TTL + 限流）
- Day 4：`/auth/tenants` + `/auth/switch-tenant`；建立 tenant 上下文
- Day 5：权限点 seed + 角色/授权接口 + Permission Guard

