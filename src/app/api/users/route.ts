import { NextResponse } from "next/server";
import {
  UserEmailTakenError,
  createUser,
  listUsers,
} from "@/server/users/user.service";
import { createUserSchema } from "@/shared/validations/user";

// GET /api/users —— 获取用户列表
export async function GET() {
  const users = await listUsers();
  return NextResponse.json(users);
}

// POST /api/users —— 新建用户
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  // 路由层只负责:校验入参 → 调 service → 把领域错误映射成 HTTP 状态码。
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "参数校验失败", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const user = await createUser(parsed.data);
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    if (err instanceof UserEmailTakenError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
