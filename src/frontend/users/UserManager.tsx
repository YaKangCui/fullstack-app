"use client";

import { useEffect, useState, useTransition } from "react";

import { createUser, deleteUser, listUsers } from "./api";
import type { User } from "./types";

const emptyForm = {
  name: "",
  email: "",
};

export function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    listUsers()
      .then((nextUsers) => {
        if (isMounted) {
          setUsers(nextUsers);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await createUser(form);
        setForm(emptyForm);
        setUsers(await listUsers());
      } catch (err) {
        setError(getErrorMessage(err));
      }
    });
  }

  async function handleDelete(id: number) {
    setError(null);

    startTransition(async () => {
      try {
        await deleteUser(id);
        setUsers((currentUsers) =>
          currentUsers.filter((user) => user.id !== id)
        );
      } catch (err) {
        setError(getErrorMessage(err));
      }
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-10 font-sans sm:px-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">用户管理</h1>
        <p className="text-sm text-zinc-500">
          一个 Next.js API Routes、Prisma、PostgreSQL 和 Zod 串起来的练手 CRUD。
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid gap-3 rounded border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={form.name}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                name: event.target.value,
              }))
            }
            placeholder="姓名"
            className="min-w-0 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            value={form.email}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                email: event.target.value,
              }))
            }
            placeholder="邮箱"
            className="min-w-0 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {isPending ? "处理中..." : "添加"}
          </button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-500">用户列表</h2>

        {isLoading ? (
          <p className="rounded border border-dashed border-zinc-200 py-8 text-center text-sm text-zinc-400 dark:border-zinc-800">
            正在加载用户...
          </p>
        ) : (
          <ul className="grid gap-2">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between gap-4 rounded border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{user.name}</p>
                  <p className="truncate text-sm text-zinc-500">
                    {user.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(user.id)}
                  disabled={isPending}
                  className="shrink-0 text-sm text-red-500 hover:underline disabled:opacity-50"
                >
                  删除
                </button>
              </li>
            ))}
            {users.length === 0 && (
              <li className="rounded border border-dashed border-zinc-200 py-8 text-center text-sm text-zinc-400 dark:border-zinc-800">
                还没有用户，加一个试试
              </li>
            )}
          </ul>
        )}
      </section>
    </main>
  );
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "操作失败";
}
