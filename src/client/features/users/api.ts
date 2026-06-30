import type { CreateUserPayload, User } from "./types";

type ApiErrorBody = {
  error?: string;
};

export async function listUsers(): Promise<User[]> {
  const response = await fetch("/api/users");
  return parseResponse<User[]>(response, "获取用户列表失败");
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<User>(response, "创建用户失败");
}

export async function deleteUser(id: number): Promise<void> {
  const response = await fetch(`/api/users/${id}`, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "删除用户失败"));
  }
}

async function parseResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, fallbackMessage));
  }

  return response.json() as Promise<T>;
}

async function getErrorMessage(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  const data = (await response.json().catch(() => null)) as ApiErrorBody | null;
  return data?.error ?? fallbackMessage;
}
