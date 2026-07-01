import { z } from "zod";

// 创建用户时的入参校验。
// 前端传来的数据绝不能直接信任,后端用 Zod 在写库前做一道校验。
export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "姓名不能为空")
    .max(100, "姓名最多 100 个字符"),
  email: z
    .email("邮箱格式不正确")
    .max(255, "邮箱最多 255 个字符"),
});

// 更新用户:所有字段可选,但至少要传一个。
export const updateUserSchema = createUserSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "至少需要提供一个要更新的字段" }
);

// 从 schema 推导出 TypeScript 类型,前后端类型一致、零手写。
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
