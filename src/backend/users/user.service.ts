import { prisma } from "@/backend/db/prisma";
import {
  isPrismaNotFoundError,
  isPrismaUniqueConstraintError,
} from "@/backend/prisma/errors";
import type {
  CreateUserInput,
  UpdateUserInput,
} from "@/backend/validations/user";

// 领域错误:由 service 抛出,路由层据此映射 HTTP 状态码。
// service 只关心"业务上发生了什么",不关心 HTTP。
export class UserNotFoundError extends Error {
  constructor() {
    super("用户不存在");
    this.name = "UserNotFoundError";
  }
}

export class UserEmailTakenError extends Error {
  constructor() {
    super("该邮箱已被注册");
    this.name = "UserEmailTakenError";
  }
}

// 获取用户列表,按创建时间倒序。
export function listUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
}

// 查询单个用户,不存在抛 UserNotFoundError。
export async function getUser(id: number) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new UserNotFoundError();
  }
  return user;
}

// 新建用户。邮箱唯一,重复触发 Prisma P2002。
export async function createUser(data: CreateUserInput) {
  try {
    return await prisma.user.create({ data });
  } catch (err) {
    if (isPrismaUniqueConstraintError(err)) {
      throw new UserEmailTakenError();
    }
    throw err;
  }
}

// 更新用户。记录不存在抛 P2025,邮箱冲突抛 P2002。
export async function updateUser(id: number, data: UpdateUserInput) {
  try {
    return await prisma.user.update({ where: { id }, data });
  } catch (err) {
    if (isPrismaNotFoundError(err)) {
      throw new UserNotFoundError();
    }
    if (isPrismaUniqueConstraintError(err)) {
      throw new UserEmailTakenError();
    }
    throw err;
  }
}

// 删除用户。记录不存在抛 P2025。
export async function deleteUser(id: number) {
  try {
    await prisma.user.delete({ where: { id } });
  } catch (err) {
    if (isPrismaNotFoundError(err)) {
      throw new UserNotFoundError();
    }
    throw err;
  }
}
