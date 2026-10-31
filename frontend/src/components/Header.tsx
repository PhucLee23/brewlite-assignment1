"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useHydrated } from "@/lib/hooks";
import { useAuth } from "@/store/auth";
import { selectCount, useCart } from "@/store/cart";

const NAV_LINK = "rounded-lg px-2 py-1.5 hover:bg-latte";
// Gạch chân mục đang mở để khách biết mình đang ở trang nào
const NAV_ACTIVE = "font-semibold underline decoration-2 underline-offset-[6px]";

export default function Header() {
  const hydrated = useHydrated();
  const count = useCart(selectCount);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navClass = (active: boolean) => (active ? `${NAV_LINK} ${NAV_ACTIVE}` : NAV_LINK);
  const onMenu = pathname === "/" || pathname.startsWith("/products");
  const onCart = pathname === "/cart";

  return (
    <header className="sticky top-0 z-10 border-b border-latte bg-foam/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-espresso">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-espresso text-sm text-foam">
            B
          </span>
          {/* Màn hình hẹp chỉ giữ logo để menu không bị xuống dòng */}
          <span className="max-sm:sr-only">BrewLite</span>
        </Link>

        <nav className="flex items-center gap-1 whitespace-nowrap text-sm sm:gap-3">
          <Link
            href="/"
            className={navClass(onMenu)}
            aria-current={onMenu ? "page" : undefined}
          >
            Menu
          </Link>
          <Link
            href="/cart"
            className={`relative ${navClass(onCart)}`}
            aria-current={onCart ? "page" : undefined}
            aria-label={`Giỏ hàng, ${hydrated ? count : 0} món`}
          >
            Giỏ hàng
            {hydrated && count > 0 && (
              <span className="absolute -right-1.5 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-crema px-1 text-xs font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
          {hydrated &&
            (user ? (
              <div className="flex items-center gap-2 sm:ml-1 sm:border-l sm:border-latte sm:pl-3">
                <span className="hidden text-right leading-tight sm:block">
                  <span className="block font-medium">{user.fullName}</span>
                  <span className="block text-xs text-roast">{user.loyaltyPoints} điểm thưởng</span>
                </span>
                <button
                  onClick={() => {
                    logout();
                    router.push("/");
                  }}
                  className="rounded-lg px-2 py-1.5 text-roast hover:bg-latte"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link href="/login" className="ml-1 rounded-lg bg-espresso px-3 py-1.5 font-medium text-foam hover:bg-roast">
                Đăng nhập
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
