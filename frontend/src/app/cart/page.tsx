"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { EmptyState, primaryButton, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { formatVND } from "@/lib/format";
import { useHydrated } from "@/lib/hooks";
import type { Product } from "@/lib/types";
import { MAX_QTY, selectTotal, useCart } from "@/store/cart";

export default function CartPage() {
  const hydrated = useHydrated();
  const { items, setQty, remove } = useCart();
  const total = useCart(selectTotal);
  // Tồn kho mới nhất (dùng chung cache với trang Menu) để không cho chọn vượt số ly còn lại
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: () => api<Product[]>("/products") });

  if (!hydrated) return <Spinner />;

  const stockById = new Map(products?.map((p) => [p.id, p.stock]));
  // Cùng một món có thể nằm ở nhiều dòng (khác size, topping) nhưng dùng chung tồn kho
  const qtyByProduct = new Map<number, number>();
  for (const i of items) qtyByProduct.set(i.productId, (qtyByProduct.get(i.productId) ?? 0) + i.qty);
  const overStock = [...qtyByProduct].some(([id, qty]) => qty > (stockById.get(id) ?? Infinity));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Giỏ hàng</h1>
      {items.length === 0 ? (
        <EmptyState title="Giỏ hàng đang trống." action={{ href: "/", label: "Xem menu" }} />
      ) : (
        <>
          <ul className="divide-y divide-latte rounded-2xl border border-latte bg-white">
            {items.map((item) => {
              const stock = stockById.get(item.productId);
              const productQty = qtyByProduct.get(item.productId) ?? 0;
              const atLimit = stock !== undefined && productQty >= stock;
              let stockNote: { text: string; error: boolean } | null = null;
              if (stock === 0) stockNote = { text: "Món này đã hết hàng, vui lòng xóa khỏi giỏ.", error: true };
              else if (stock !== undefined && productQty > stock)
                stockNote = { text: `Chỉ còn ${stock} ly, vui lòng giảm số lượng.`, error: true };
              else if (atLimit) stockNote = { text: `Đã chọn hết ${stock} ly còn lại.`, error: false };

              return (
                <li key={item.key} className="flex gap-3 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt="" className="h-16 w-16 flex-none rounded-xl bg-latte object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <p className="font-medium">
                        {item.name} <span className="text-roast">· Size {item.size}</span>
                      </p>
                      <p className="whitespace-nowrap font-semibold">{formatVND(item.unitPrice * item.qty)}</p>
                    </div>
                    <p className="truncate text-sm text-roast">
                      {item.toppings.length ? item.toppings.map((t) => t.name).join(", ") : "Không topping"} ·{" "}
                      {formatVND(item.unitPrice)}/ly
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-latte">
                        <button
                          className="px-2.5 py-1 disabled:opacity-30"
                          onClick={() => setQty(item.key, item.qty - 1)}
                          disabled={item.qty <= 1}
                          aria-label={`Giảm số lượng ${item.name}`}
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-sm font-semibold">{item.qty}</span>
                        <button
                          className="px-2.5 py-1 disabled:opacity-30"
                          onClick={() => setQty(item.key, item.qty + 1)}
                          disabled={item.qty >= MAX_QTY || atLimit}
                          aria-label={`Tăng số lượng ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                      <button onClick={() => remove(item.key)} className="text-sm text-red-700 hover:underline">
                        Xóa
                      </button>
                    </div>
                    {stockNote && (
                      <p className={`mt-1.5 text-sm ${stockNote.error ? "text-red-700" : "text-amber-800"}`}>
                        {stockNote.text}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-roast">Tổng cộng</span>
            <span className="text-2xl font-bold">{formatVND(total)}</span>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row-reverse">
            {overStock ? (
              <button disabled className={`${primaryButton} flex-1`}>
                Giảm số lượng để thanh toán
              </button>
            ) : (
              <Link href="/checkout" className={`${primaryButton} flex-1 text-center`}>
                Thanh toán {formatVND(total)}
              </Link>
            )}
            <Link href="/" className="flex-1 rounded-xl px-5 py-3 text-center font-medium text-roast hover:bg-latte">
              Mua thêm
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
