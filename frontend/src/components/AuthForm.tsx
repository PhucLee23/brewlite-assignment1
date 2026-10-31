"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { ErrorBox, inputClass, primaryButton } from "@/components/ui";
import { api } from "@/lib/api";
import type { AuthResponse } from "@/lib/types";
import { useAuth } from "@/store/auth";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuth((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Chỉ chấp nhận đường dẫn nội bộ để tránh open redirect
  const nextParam = params.get("next");
  const next = nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";
  const isLogin = mode === "login";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      const body = isLogin
        ? { email: form.get("email"), password: form.get("password") }
        : { email: form.get("email"), password: form.get("password"), fullName: form.get("fullName") };
      const res = await api<AuthResponse>(isLogin ? "/auth/login" : "/auth/register", { method: "POST", body });
      setAuth(res.accessToken, res.user);
      router.replace(next);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  const switchHref = `${isLogin ? "/register" : "/login"}${nextParam ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">{isLogin ? "Đăng nhập" : "Tạo tài khoản"}</h1>
      <p className="mb-6 mt-1 text-roast">
        {isLogin ? "Đăng nhập để đặt đơn và tích điểm." : "Tích 1 điểm cho mỗi 1.000đ thanh toán."}
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {!isLogin && (
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Họ tên
            <input name="fullName" required minLength={2} maxLength={100} className={inputClass} autoComplete="name" />
          </label>
        )}
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Email
          <input name="email" type="email" required className={inputClass} autoComplete="email" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Mật khẩu
          <input
            name="password"
            type="password"
            required
            minLength={isLogin ? 1 : 6}
            className={inputClass}
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
        </label>
        {error && <ErrorBox message={error} />}
        <button type="submit" disabled={submitting} className={primaryButton}>
          {submitting ? "Đang xử lý..." : isLogin ? "Đăng nhập" : "Đăng ký"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-roast">
        {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
        <Link href={switchHref} className="font-semibold text-espresso underline">
          {isLogin ? "Đăng ký" : "Đăng nhập"}
        </Link>
      </p>
      {isLogin && (
        <p className="mt-4 rounded-xl bg-latte p-3 text-center text-xs text-roast">
          Tài khoản demo: khach@brewlite.vn / 123456
        </p>
      )}
    </div>
  );
}
