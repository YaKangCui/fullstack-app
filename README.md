# fullstack-app

前端转全栈练手项目:Next.js 16 (App Router) + TypeScript + Prisma 7 + PostgreSQL + Zod。

实现了一个完整的用户增删改查 (CRUD),把"前端页面 → API Routes → Zod 校验 → Prisma → PostgreSQL"整条链路串起来。

## 快速开始

```bash
# 确保本地 PostgreSQL 在跑 (Homebrew)
brew services start postgresql@17

# 启动开发服务器
npm run dev
```

打开 http://localhost:3000,可以添加/删除用户。

## 项目结构

代码按前后端分离的思路分层:前端 (`client`)、后端 (`server`)、共享 (`shared`)、路由层 (`app`) 各归各的。
详细的分层职责与数据流见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

```
prisma/
  schema.prisma            # 表设计:User 模型 → 映射到 users 表
  migrations/              # 迁移历史 (prisma migrate dev 生成)
src/
  app/                     # 路由层(薄):App Router
    api/users/route.ts        # GET 列表 / POST 创建
    api/users/[id]/route.ts   # GET 单个 / PATCH 更新 / DELETE 删除
    page.tsx                  # 前端页面,渲染 <UserManager />
  client/features/users/   # 前端:UI 组件 + fetch 封装 + 类型
  server/                  # 后端:Prisma 单例 + service 业务层 + 错误处理
    db/prisma.ts
    users/user.service.ts
    prisma/errors.ts
  shared/validations/      # 前后端共享:Zod schema + 推导类型
```

## 对应你列的学习路径

- [x] **Next.js API Routes** —— `src/app/api/users/` 下的 `route.ts`
  - 注意 Next.js 16 里 `params` 是异步的,要 `await ctx.params`,类型用全局 `RouteContext<'/api/users/[id]'>`
- [x] **PostgreSQL 表设计** —— `prisma/schema.prisma` 的 User 模型
- [x] **Prisma 增删改查** —— 各 route 里的 `prisma.user.findMany/create/update/delete`
- [x] **Zod 接口校验** —— `src/shared/validations/user.ts`,在 route 里用 `safeParse`
- [ ] **基础鉴权 (JWT / Session)** —— 下一步
- [ ] **部署上线 (Vercel / Docker)** —— 下一步

## 常用命令

```bash
npm run dev                      # 开发服务器
npx prisma studio                # 可视化看/改数据库数据
npx prisma migrate dev --name x  # 改完 schema 后建新迁移
npx prisma generate              # 重新生成 client
```

## API 速查

| 方法   | 路径             | 说明     | 成功码 |
| ------ | ---------------- | -------- | ------ |
| GET    | `/api/users`     | 用户列表 | 200    |
| POST   | `/api/users`     | 创建用户 | 201    |
| GET    | `/api/users/:id` | 单个用户 | 200    |
| PATCH  | `/api/users/:id` | 更新用户 | 200    |
| DELETE | `/api/users/:id` | 删除用户 | 204    |

校验失败返回 400,邮箱重复返回 409,记录不存在返回 404。

## 下一步建议

1. **鉴权**:加一张 `Session` 或用 JWT,给 API 加登录保护。可以看 `next-auth` (Auth.js)。
2. **前端数据获取**:把 `page.tsx` 里手写的 `fetch` 换成 TanStack Query,自动处理缓存/重试/加载态。
3. **部署**:推到 GitHub 后用 Vercel 一键部署;数据库可以用 Supabase 或 Neon 这类托管 PostgreSQL。
