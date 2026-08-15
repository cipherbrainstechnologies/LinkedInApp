const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";

export type AdminMe = {
  id: string;
  email: string;
  displayName: string;
  permissions: string[];
  roles: string[];
  demoMode: boolean;
};

export async function adminApi<T>(
  path: string,
  options?: RequestInit & { json?: unknown },
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options?.json ? { "Content-Type": "application/json" } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
    body: options?.json ? JSON.stringify(options.json) : options?.body,
  });

  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.detail ?? err.message ?? "Request failed");
  }

  return res.json() as Promise<T>;
}
