import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  UserEmailTakenError,
  UserNotFoundError,
  deleteUser,
  getUser,
  updateUser,
} from "@/backend/users/user.service";
import { updateUserSchema } from "@/backend/validations/user";

// Next.js 16: params 是异步的,需要 await ctx.params。
// RouteContext<'/api/users/[id]'> 是全局类型助手,由 next dev/build 自动生成。

// GET /api/users/[id] —— 查询单个用户
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/users/[id]">
) {
  const { id } = await ctx.params;

  try {
    const user = await getUser(Number(id));
    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}

// PATCH /api/users/[id] —— 更新用户
export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/users/[id]">
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "参数校验失败", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const user = await updateUser(Number(id), parsed.data);
    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof UserEmailTakenError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}

// DELETE /api/users/[id] —— 删除用户
export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/users/[id]">
) {
  const { id } = await ctx.params;

  try {
    await deleteUser(Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}
