# 架构说明

本项目是一个 Next.js 16 全栈应用,目前采用**按层分目录**:

- `src/frontend`:前端代码
- `src/backend`:后端代码
- `src/app`:Next.js 路由入口
- `prisma`:数据库模型和迁移

这不是严格意义上的“分包管理”。分包管理通常指 monorepo/workspace,例如用 pnpm workspace 拆出 `apps/web`、`packages/api`、`packages/database` 这种独立 package。

## 为什么先不做真正分包

这是一个单表(User)、几个 CRUD 接口的练手项目。如果现在就拆成多个 package,会额外增加 workspace 配置、跨包构建、类型导出、部署路径等成本。

当前更适合先把前后端边界整理清楚:

- 前端文件统一放 `src/frontend`
- 后端文件统一放 `src/backend`
- `src/app` 只保留 Next.js 必须存在的页面/API route 入口
- 后端业务逻辑收进 service,route 只做 HTTP 收发和错误码映射

以后项目变大,可以从这个结构平滑升级到 pnpm workspace。

## 当前目录

```
prisma/
  schema.prisma              # User 表模型
  migrations/                # 数据库迁移历史

src/
  app/                       # Next.js 路由入口,保持很薄
    page.tsx                    # 渲染 <UserManager />
    api/users/route.ts          # GET 列表 / POST 创建
    api/users/[id]/route.ts     # GET 单个 / PATCH 更新 / DELETE 删除
    layout.tsx / globals.css

  frontend/                  # 前端代码
    users/
      UserManager.tsx           # 用户管理 UI
      api.ts                    # 浏览器端 fetch 封装
      types.ts                  # 前端类型

  backend/                   # 后端代码
    db/prisma.ts                # Prisma client 单例
    prisma/errors.ts            # Prisma 错误码判断
    users/user.service.ts       # 用户业务逻辑
    validations/user.ts         # Zod 入参校验

  generated/prisma/          # Prisma 自动生成的 client,不要手改
```

## 各层职责

| 层 | 目录 | 职责 |
| --- | --- | --- |
| 路由入口 | `src/app` | Next.js 页面/API route。只做转发、入参校验、HTTP 状态码映射 |
| 前端 | `src/frontend` | React 组件、浏览器端请求、前端展示状态 |
| 后端 | `src/backend` | 数据库连接、业务逻辑、Prisma 调用、Zod 校验、后端错误处理 |
| 数据库 | `prisma` | schema 和迁移 |

## 数据流

创建用户时的数据流:

```
src/frontend/users/UserManager.tsx
  -> src/frontend/users/api.ts
    -> src/app/api/users/route.ts
      -> src/backend/validations/user.ts
      -> src/backend/users/user.service.ts
        -> src/backend/db/prisma.ts
          -> PostgreSQL
```

错误处理分两段:

1. `backend/users/user.service.ts` 把 Prisma 错误码翻译成业务错误。
2. `app/api/.../route.ts` 把业务错误翻译成 HTTP 状态码。

这样 route 不需要知道 Prisma 细节,service 也不需要知道 HTTP。

## 如果以后做分包管理

后面项目更大时,可以升级成 pnpm workspace:

```
apps/web/          # Next.js 应用
packages/api/      # 后端服务层或 API
packages/database/ # Prisma schema/client
packages/shared/   # 前后端共享类型、工具
```

到那一步才更适合叫“分包管理”或 monorepo。
