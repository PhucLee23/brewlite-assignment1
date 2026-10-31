"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/store/auth";

/** true sau khi component đã mount ở trình duyệt (tránh lệch HTML khi đọc localStorage). */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

/** Chuyển sang trang đăng nhập nếu chưa có token; trả về token khi đã sẵn sàng. */
export function useRequireAuth(): string | null {
  const hydrated = useHydrated();
  const token = useAuth((s) => s.token);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (hydrated && !token) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, token, router, pathname]);

  return hydrated ? token : null;
}
