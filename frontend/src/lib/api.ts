import { useAuth } from "@/store/auth";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  token?: string | null;
  idempotencyKey?: string;
}

/** Gọi REST API của backend NestJS và chuẩn hóa thông báo lỗi tiếng Việt. */
export async function api<T>(path: string, { method = "GET", body, token, idempotencyKey }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Không kết nối được máy chủ. Kiểm tra backend đã chạy chưa.", 0);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) {
      // Token hết hạn/không hợp lệ: đăng xuất để các trang cần đăng nhập tự chuyển về /login
      useAuth.getState().logout();
      throw new ApiError("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.", 401);
    }
    const raw = data?.message;
    const message = Array.isArray(raw) ? raw.join(", ") : raw || `Lỗi ${res.status}`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export function newIdempotencyKey(): string {
  // randomUUID chỉ có trong secure context (https hoặc localhost)
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
