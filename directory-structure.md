tob-multi-tenant-admin/
  apps/
    web/
      public/
      src/
        app/                  # 应用级：Provider、布局、路由守卫
        pages/                # 路由页面
          auth/
            Login.tsx
            SelectTenant.tsx
          app/
            Dashboard.tsx
            TenantUsers.tsx
            Roles.tsx
            AuditLogs.tsx
            Settings.tsx
        components/           # 通用组件（Layout、Table、Form 封装）
        services/             # API：auth/tenant/rbac/audit/settings
        store/                # 状态（可选：zustand/redux）
        styles/               # tailwind入口、全局样式、antd覆盖
        utils/                # token、权限判断、request封装
        main.tsx
        App.tsx
      index.html
      vite.config.ts
      tsconfig.json
      tailwind.config.ts
      postcss.config.js
      package.json
    api/
      src/
        modules/
          auth/
          tenant/
          rbac/
          audit/
          settings/
          platform/
        shared/
          config/
          logger/
          exceptions/
          request-context/
        main.ts
      prisma/
        schema.prisma
        migrations/
        seed.ts
      test/
      tsconfig.json
      package.json
  packages/
    shared/
      src/
        permissions.ts
        error-codes.ts
        dto/
      tsconfig.json
      package.json
  infra/
    docker-compose.yml        # postgres + redis + (可选) nginx
    nginx/
      nginx.conf
  docs/
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
  .env.example