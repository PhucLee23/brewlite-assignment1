"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { EmptyState, ErrorBox } from "@/components/ui";
import { api } from "@/lib/api";
import { formatVND } from "@/lib/format";
import { useHydrated } from "@/lib/hooks";
import type { Product } from "@/lib/types";
import { useCart } from "@/store/cart";

export default function MenuPage() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["products"],
    queryFn: () => api<Product[]>("/products"),
  });
  const hydrated = useHydrated();
  const cartItems = useCart((s) => s.items);

  // Số ly mỗi món đang có trong giỏ (cộng mọi size, topping); chỉ đọc giỏ sau khi đã mount ở trình duyệt
  const inCart = new Map<number, number>();
  if (hydrated) for (const i of cartItems) inCart.set(i.productId, (inCart.get(i.productId) ?? 0) + i.qty);

  return (
    <div>
      <section className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Hôm nay bạn uống gì?</h1>
        <p className="mt-1 text-roast">Chọn món, thanh toán không tiền mặt, tới quầy nhận nước.</p>
      </section>

      {isPending && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-busy>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-60 animate-pulse rounded-2xl bg-latte" />
          ))}
        </div>
      )}
      {isError && <ErrorBox message={error.message} onRetry={() => refetch()} />}
      {data && data.length === 0 && <EmptyState title="Menu đang được cập nhật, vui lòng quay lại sau." />}
      {data && data.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data.map((p) => (
            <li key={p.id}>
              <Link
                href={`/products/${p.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-latte bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden bg-latte">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-110 motion-safe:group-focus-visible:scale-110"
                  />
                  {p.stock === 0 && (
                    <span className="absolute inset-0 grid place-items-center bg-white/70 font-semibold text-roast">
                      Hết hàng
                    </span>
                  )}
                  {p.stock > 0 && p.stock <= 5 && (
                    <span className="absolute left-2 top-2 rounded-full bg-crema px-2 py-0.5 text-xs font-semibold text-white">
                      Còn {p.stock}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-end gap-1 p-3 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
                  <span className="font-medium leading-snug">
                    {p.name}
                    {inCart.has(p.id) && (
                      <span className="ml-1.5 inline-block whitespace-nowrap rounded-full bg-crema/15 px-2 py-0.5 align-middle text-xs font-semibold text-roast">
                        {inCart.get(p.id)} trong giỏ
                      </span>
                    )}
                  </span>
                  <span className="whitespace-nowrap font-semibold text-roast">{formatVND(p.price)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
