// Prisma 错误码判断。update/delete 找不到记录抛 P2025,唯一约束冲突抛 P2002。
export function isPrismaNotFoundError(err: unknown): boolean {
  return hasPrismaCode(err, "P2025");
}

export function isPrismaUniqueConstraintError(err: unknown): boolean {
  return hasPrismaCode(err, "P2002");
}

function hasPrismaCode(err: unknown, code: string): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === code
  );
}
