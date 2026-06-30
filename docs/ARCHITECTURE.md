# 架构说明

本项目是一个 Next.js 16 全栈应用,但代码按**前后端分离的思路**做了清晰分层。
没有拆成两个独立进程/服务,而是在同一个 Next.js 应用内把"前端代码、后端代码、共享代码、路由层"严格隔离开。

## 为什么没有拆独立后端

这是一个单表(User)、几个 CRUD 接口的项目。如果为它单独起一个 Express/Nest 进程,要额外背上跨进程 CORS、两个 dev server、两套部署、前后端类型手动同步等成本,投入产出不划算。

因此选择**保留 Next.js,只做分层整理**:

- 前端、后端、共享代码各归各的目录,边界清晰,互不越界
- 后端业务逻辑收进 service 层,路由层退化成只做 HTTP 收发的薄壳
- 以后真要拆独立后端,`src/server` 整块迁出即可,前端只需把 `fetch` 的相对路径改成绝对地址,迁移平滑

## 目录分层

```
src/
  app/                       # 路由层(薄):Next.js App Router
    api/users/route.ts          # GET 列表 / POST 创建
    api/users/[id]/route.ts     # GET 单个 / PATCH 更新 / DELETE 删除
    page.tsx                    # 只渲染 <UserManager />
    layout.tsx / globals.css

  client/                    # 前端
    features/users/
      UserManager.tsx           # 用户管理 UI(React 组件)
      api.ts                    # 浏览器侧请求封装(fetch /api/users)
      types.ts                  # 前端用到的 User 类型

  server/                    # 后端
    db/prisma.ts                # Prisma client 单例(全项目唯一一份)
    users/user.service.ts       # 业务逻辑 + Prisma 调用 + 领域错误
    prisma/errors.ts            # Prisma 错误码判断(P2002 / P2025)

  shared/                    # 前后端共享
    validations/user.ts         # Zod schema + 推导出的输入类型

  generated/prisma/          # Prisma 自动生成的 client(勿手改)
```

## 各层职责

| 层 | 目录 | 职责 | 不该做什么 |
| --- | --- | --- | --- |
| 路由层 | `app/api` | 解析入参、Zod 校验、调 service、把领域错误映射成 HTTP 状态码 | 不直接碰 Prisma、不写业务逻辑 |
| 后端 service | `server/users` | 业务逻辑、Prisma 读写、把 Prisma 错误翻译成领域错误 | 不感知 HTTP(不返回 Response、不读 status code) |
| 前端 | `client/features` | 渲染 UI、调浏览器侧 `api.ts` | 不直接 import `server/*`(会把 Prisma 打进浏览器包) |
| 共享 | `shared` | 前后端都要用的 Zod schema 与类型 | 不放任何只属于单边的逻辑 |

## 数据流

一次"创建用户"请求的完整链路:

```
UserManager.tsx          (前端组件,用户点"添加")
  → client/.../api.ts        fetch POST /api/users
    → app/api/users/route.ts   Zod 校验入参 → 调 service → 映射状态码
      → server/users/user.service.ts  createUser():写库,捕获 P2002
        → server/db/prisma.ts          prisma.user.create()
          → PostgreSQL
```

返回时原路返回。其中**错误的翻译发生在两个边界**:

1. service 层把 Prisma 错误码(`P2002` 唯一约束、`P2025` 记录不存在)翻译成领域错误(`UserEmailTakenError` / `UserNotFoundError`)
2. 路由层把领域错误翻译成 HTTP 状态码(409 / 404)

这样 service 不需要知道 HTTP,路由不需要知道 Prisma,各管一段。

## 关键约定

- **路径别名**:`@/*` → `src/*`(见 `tsconfig.json`),所有内部 import 用 `@/server/...`、`@/client/...`、`@/shared/...`,不用相对路径跨层。
- **Prisma 单例**:全项目只有 `src/server/db/prisma.ts` 一份,挂在 `globalThis` 上避免开发模式热重载耗尽连接。
- **前端禁止 import `server/*`**:`server` 层依赖 Prisma,只能在服务端运行;前端要数据一律走 `api.ts` 的 HTTP 请求。
- **校验只信后端**:前端可以做体验性校验,但 `shared/validations` 的 Zod schema 在路由层做的那道校验才是可信防线。

## 重构记录(本次整理做了什么)

整理前的"乱"主要是重复,已全部消除:

- 删除重复的 Prisma client(原 `src/lib/prisma.ts`,统一为 `src/server/db/prisma.ts`)
- 删除两个 route 里各自内联的错误判断函数,统一用 `src/server/prisma/errors.ts`
- 删除 `page.tsx` 里内联的整套 UI,改为复用 `UserManager` 组件
- 消除两份 `User` 类型定义
- 新增 `server/users/user.service.ts` 业务层,路由层改薄
- 按前端 / 后端 / 共享重新归置目录(`client` / `server` / `shared`)
