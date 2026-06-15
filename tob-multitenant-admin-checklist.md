# ToB 多租户后台项目清单（作品向，可独立交付）

目标：做出一套“可上线、可演示、可复用”的 ToB 多租户后台（SaaS Admin Console）作品，覆盖多租户隔离、RBAC、审计、部署与基础可观测。

---

## 1. 选型与决策（作品向推荐）

- 数据库：PostgreSQL
- 租户隔离：共享库共享表 + `tenant_id` 字段隔离
- 租户识别：登录后选择租户（Token 内携带 `tenantId`）
- 后端：Node.js + TypeScript + NestJS
- ORM：Prisma
- 缓存：Redis
- 鉴权：JWT + Refresh Token
- 部署：Docker Compose + Nginx（HTTPS 反代）
- 管理端前端：React
- 登录方式：邮箱 + 密码、手机号 + 验证码（OTP）

---

## 2. 作品范围（你要交付的“最小满分”功能）

### 2.1 多租户能力（必须）

- 租户（Tenant）管理（平台超管）
  - 创建租户、启用/停用
- 用户与租户关系（Tenant User）
  - 一个账号可以加入多个租户
  - 登录后可选择进入的租户
- 租户隔离
  - 除平台超管接口外，所有业务表都必须带 `tenant_id`
  - 所有业务查询默认带 `tenant_id` 过滤

### 2.2 账号体系（必须）

- 登录/退出
- 支持两种登录
  - 邮箱 + 密码
  - 手机号 + 验证码（OTP，建议通过 Redis 存储验证码与限流）
- Refresh Token（可失效、可撤销）
- 密码安全：哈希存储（bcrypt/argon2 选一）

### 2.3 RBAC 权限（必须）

- 权限点（Permission）内置种子（seed）
- 角色（Role）管理（租户级）
- 成员（Tenant User）绑定角色（多角色）
- 后端强校验（前端只做展示，不作为安全边界）

### 2.4 审计日志（必须）

- 记录关键写操作：谁（actor）、对什么资源（resource）、做了什么（action）、结果如何
- 支持分页与筛选（按时间、资源类型、操作者）

### 2.5 租户配置中心（建议）

- 租户级配置：如 logo、主题色、开关项（JSON）
- 配置变更写入审计

### 2.6 文件与对象存储（可选加分）

- 文件上传（本地存储起步，后续可切换 OSS/S3）
- 文件鉴权下载（至少限制“同租户可访问”）

---

## 3. 里程碑（按阶段交付与验收）

### M1：工程骨架（后端优先）

- [ ] NestJS 初始化：模块化结构、配置分环境（dev/stage/prod）
- [ ] Prisma 初始化：schema、migration、seed
- [ ] 全局能力
  - [ ] 参数校验（DTO/schema）
  - [ ] 统一错误码与异常处理
  - [ ] 结构化日志（包含 requestId）
  - [ ] Swagger/OpenAPI 自动生成
- [ ] Docker Compose：Postgres + Redis + API

**验收标准**
- 服务可一键启动（docker compose up）
- Swagger 可访问并可调通一个 health 接口
- migration/seed 可在全新环境复现

### M2：登录与租户识别（核心）

- [ ] 用户注册/创建（可先后台 seed 一个用户）
- [ ] 登录：返回 accessToken + refreshToken
- [ ] 查询“我加入的租户列表”
- [ ] 选择租户进入：颁发携带 `tenantId` 的 accessToken
- [ ] `GET /auth/me` 返回当前 tenant 上下文信息

**验收标准**
- 同一 user 可加入多个 tenant，切换 tenant 后数据隔离正确
- refreshToken 可撤销，accessToken 过期后可刷新

### M3：RBAC（作品核心亮点）

- [ ] 权限点 seed（例如 user.read、user.write、role.manage、audit.read）
- [ ] 角色管理：创建/编辑/禁用
- [ ] 角色绑定权限点
- [ ] 成员绑定角色
- [ ] 后端权限守卫：无权限返回明确错误码

**验收标准**
- 任何受保护接口都能被权限模型解释（为何允许/禁止）
- 前端菜单/按钮随权限变化（加分）

### M4：租户成员管理 + 审计日志

- [ ] 租户成员列表、启用/禁用
- [ ] 写操作自动审计（创建角色/改权限/禁用成员/改配置等）
- [ ] 审计日志查询（分页+筛选）

**验收标准**
- 能追溯一次权限变更：操作者、变更前后、时间、IP

### M5：部署上线（作品必须有）

- [ ] Nginx 反向代理 API（可加静态前端）
- [ ] HTTPS（本地自签 + 线上 Let’s Encrypt 方案说明）
- [ ] 环境变量与密钥：不入库、不入日志
- [ ] 一份 Runbook：部署/回滚/排障

**验收标准**
- 一台干净服务器可按文档部署成功
- 服务重启后可自恢复

### M6：质量与稳定性（加分项）

- [ ] 单元测试：Service 层关键逻辑
- [ ] 集成测试：至少 1 条关键链路走真实 DB
- [ ] 限流/防爆破（登录接口）
- [ ] 基础指标：请求量、错误率、P95（能落地就满分）

**验收标准**
- 发布前自动跑测试（本地或 CI）
- 线上出现错误可从日志快速定位（requestId 串联）

---

## 4. 数据库表（最小可用模型，建议按此落地）

### 4.1 租户与身份

- `tenants`
  - `id`、`name`、`status`、`created_at`
- `users`
  - `id`、`email`、`phone`、`password_hash`、`status`、`created_at`
- `tenant_users`（用户在租户内的身份）
  - `id`、`tenant_id`、`user_id`、`display_name`、`status`、`created_at`
  - 约束：`unique(tenant_id, user_id)`

### 4.2 RBAC

- `permissions`
  - `id`、`code`、`name`、`module`
- `roles`（租户级）
  - `id`、`tenant_id`、`name`、`code`
- `role_permissions`
  - `id`、`role_id`、`permission_id`
- `tenant_user_roles`
  - `id`、`tenant_user_id`、`role_id`

### 4.3 登录与安全

- `refresh_tokens`
  - `id`、`user_id`、`token_hash`、`expires_at`、`revoked_at`、`device_info`
- `login_logs`
  - `id`、`user_id`、`tenant_id`、`ip`、`ua`、`result`、`created_at`

### 4.4 审计与配置

- `audit_logs`
  - `id`、`tenant_id`、`actor_tenant_user_id`
  - `action`、`resource_type`、`resource_id`
  - `before`（JSON） 、`after`（JSON）
  - `ip`、`created_at`
- `tenant_settings`
  - `id`、`tenant_id`、`key`、`value_json`、`updated_at`
  - 约束：`unique(tenant_id, key)`

---

## 5. API 清单（建议先按这个实现）

### 5.1 Auth

- `POST /auth/login`
- `POST /auth/login/password`（邮箱 + 密码）
- `POST /auth/otp/send`（手机号/邮箱发送验证码）
- `POST /auth/login/otp`（手机号 + 验证码）
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /auth/tenants`（我加入的租户列表）
- `POST /auth/switch-tenant`（选择租户进入，返回带 tenantId 的 token）

### 5.2 Platform（仅平台超管）

- `POST /platform/tenants`
- `GET /platform/tenants`
- `PATCH /platform/tenants/:id`

### 5.3 Tenant Users（租户内）

- `GET /tenant/users`
- `POST /tenant/users`（创建/邀请，先做创建也可）
- `PATCH /tenant/users/:id`（启用/禁用/改名）

### 5.4 RBAC（租户内）

- `GET /permissions`
- `GET /roles`
- `POST /roles`
- `PATCH /roles/:id`
- `PUT /roles/:id/permissions`
- `PUT /tenant-users/:id/roles`

### 5.5 Audit（租户内）

- `GET /audit-logs`

### 5.6 Settings（租户内）

- `GET /settings`
- `PUT /settings`

---

## 6. 后端目录结构建议（NestJS）

建议你按“可扩展、可测试”的模块边界来组织：

- `src/modules/auth`（登录、刷新、切换租户）
- `src/modules/platform`（平台超管）
- `src/modules/tenant`（租户域：tenant、tenant_user）
- `src/modules/rbac`（role、permission、guards）
- `src/modules/audit`（审计落库与查询）
- `src/modules/settings`（租户配置）
- `src/shared`（logger、config、exception、request-context）

---

## 7. 前端页面清单（管理端）

- 登录页
- 选择租户页（进入系统前）
- 首页（Dashboard 可先空）
- 成员管理
- 角色管理
- 权限查看（只读）
- 审计日志
- 租户配置
- 平台超管（隐藏入口）：租户管理

---

## 8. 安全与质量基线（写进作品文档会很加分）

- [ ] 所有写接口都做权限校验
- [ ] 所有业务查询强制 tenant 过滤（禁止“裸查询”）
- [ ] 密码只存 hash，不回传，不落日志
- [ ] token、refresh token 不落日志
- [ ] 登录限流、防爆破（IP/账号维度，至少一个）
- [ ] 统一错误码：可统计、可定位
- [ ] 最少 1 条集成测试覆盖关键链路

---

## 9. 最终交付清单（面试/作品展示直接用）

- [ ] README：项目介绍、功能、架构、技术栈、演示账号
- [ ] 接口文档：Swagger/OpenAPI 在线地址 + 导出文件
- [ ] 数据模型说明：表结构与租户隔离策略
- [ ] 权限模型说明：RBAC 设计与落点（后端 Guard）
- [ ] 审计日志说明：记录哪些操作、字段示例
- [ ] 部署文档：Docker Compose + Nginx + HTTPS + 回滚
- [ ] 测试说明：如何运行单测/集成测试
