"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ErrorBox, primaryButton, secondaryButton, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { formatVND } from "@/lib/format";
import type { ProductDetail, Size, Topping } from "@/lib/types";
import { MAX_QTY, useCart } from "@/store/cart";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isPending, isError, error, refetch } = useQuery({
    queryKey: ["product", id],
    queryFn: () => api<ProductDetail>(`/products/${id}`),
  });

  if (isPending) return <Spinner />;
  if (isError) return <ErrorBox message={error.message} onRetry={() => refetch()} />;
  return <ProductOptions product={product} />;
}

function ProductOptions({ product }: { product: ProductDetail }) {
  const add = useCart((s) => s.add);
  // Số ly món này đã có trong giỏ (mọi size, topping) để không chọn vượt tồn kho
  const inCart = useCart((s) => s.items.reduce((sum, i) => (i.productId === product.id ? sum + i.qty : sum), 0));
  const [size, setSize] = useState<Size>("M");
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const surcharge = product.sizes.find((s) => s.size === size)?.surcharge ?? 0;
  const unitPrice = product.price + surcharge + toppings.reduce((sum, t) => sum + t.price, 0);
  const sizeStock = product.sizes.find((s) => s.size === size)?.stock ?? 0;
  // Topping cũng tốn nguyên liệu: không thêm quá số phần topping còn lại
  const stock = Math.min(sizeStock, ...toppings.map((t) => t.stock));
  const soldOut = stock === 0;
  const maxQty = Math.min(MAX_QTY, stock - inCart);
  const cartFull = !soldOut && maxQty <= 0;
  const shownQty = Math.max(1, Math.min(qty, maxQty));

  let limitNote: string | null = null;
  if (cartFull) limitNote = `Giỏ hàng đã có ${inCart} ly, bằng số ly còn lại.`;
  else if (!soldOut && shownQty >= maxQty) {
    if (maxQty === MAX_QTY && stock - inCart > MAX_QTY) limitNote = `Tối đa ${MAX_QTY} ly mỗi lần thêm.`;
    else if (inCart > 0) limitNote = `Chỉ còn ${stock} ly, giỏ hàng đã có ${inCart}.`;
    else limitNote = `Chỉ còn ${stock} ly.`;
  }

  function toggleTopping(t: Topping) {
    setAdded(false);
    setToppings((cur) => (cur.some((c) => c.id === t.id) ? cur.filter((c) => c.id !== t.id) : [...cur, t]));
  }

  function addToCart() {
    add({ productId: product.id, name: product.name, imageUrl: product.imageUrl, size, toppings, unitPrice, qty: shownQty });
    setQty(1);
    setAdded(true);
  }

  return (
    <div>
      <Link href="/" className="mb-4 inline-block text-sm text-roast hover:underline">
        ← Quay lại menu
      </Link>
      <div className="grid gap-8 md:grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl} alt={product.name} className="aspect-square w-full rounded-3xl bg-latte object-cover" />

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{product.name}</h1>
            <p className="mt-2 text-roast">{product.description}</p>
            <p className="mt-3 text-sm text-roast">
              Giá từ {formatVND(product.price)} · Còn {sizeStock} ly size {size}
            </p>
          </div>

          <fieldset>
            <legend className="mb-2 font-semibold">Size</legend>
            <div className="grid grid-cols-3 gap-2">
              {product.sizes.map((s) => (
                <label
                  key={s.size}
                  className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-crema ${
                    size === s.size ? "border-espresso bg-espresso text-foam" : "border-latte bg-white hover:bg-latte"
                  }`}
                >
                  <input
                    type="radio"
                    name="size"
                    value={s.size}
                    checked={size === s.size}
                    onChange={() => {
                      setSize(s.size);
                      setAdded(false);
                    }}
                    className="sr-only"
                  />
                  <span className="block text-lg font-bold">{s.size}</span>
                  <span className="text-xs opacity-80">
                    {s.stock === 0 ? "Hết" : s.surcharge ? `+${formatVND(s.surcharge)}` : "Giá gốc"}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 font-semibold">Topping</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {product.toppings.map((t) => {
                const checked = toppings.some((c) => c.id === t.id);
                const out = t.stock === 0;
                return (
                  <label
                    key={t.id}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition ${
                      checked
                        ? "cursor-pointer border-crema bg-crema/10"
                        : out
                          ? "cursor-not-allowed border-latte bg-white opacity-50"
                          : "cursor-pointer border-latte bg-white hover:bg-latte"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={out && !checked}
                        onChange={() => toggleTopping(t)}
                        className="accent-crema"
                      />
                      {t.name}
                    </span>
                    <span className="text-sm text-roast">{out ? "Hết" : `+${formatVND(t.price)}`}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="flex items-center gap-3">
            <span className="font-semibold">Số lượng</span>
            <div className="flex items-center rounded-xl border border-latte bg-white">
              <button
                className="px-3 py-2 text-lg disabled:opacity-30"
                onClick={() => setQty(Math.max(1, shownQty - 1))}
                disabled={shownQty <= 1}
                aria-label="Giảm"
              >
                −
              </button>
              <span className="w-8 text-center font-semibold">{shownQty}</span>
              <button
                className="px-3 py-2 text-lg disabled:opacity-30"
                onClick={() => setQty(Math.min(maxQty, shownQty + 1))}
                disabled={shownQty >= maxQty}
                aria-label="Tăng"
              >
                +
              </button>
            </div>
          </div>
          {limitNote && (
            <p role="status" className="-mt-3 text-sm text-amber-800">
              {limitNote}
            </p>
          )}

          <div className="mt-auto flex flex-col gap-3 border-t border-latte pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-roast">Thành tiền</span>
              <span className="text-2xl font-bold">{formatVND(unitPrice * shownQty)}</span>
            </div>
            <button onClick={addToCart} disabled={soldOut || cartFull} className={primaryButton}>
              {soldOut ? (product.stock === 0 ? "Hết hàng" : "Hết nguyên liệu cho lựa chọn này") : cartFull ? "Đã thêm hết số ly còn lại" : "Thêm vào giỏ"}
            </button>
            {added && (
              <div role="status" className="flex items-center justify-between rounded-xl bg-emerald-50 p-3 text-emerald-900">
                <span>Đã thêm vào giỏ hàng.</span>
                <span className="flex gap-2">
                  <Link href="/" className={`${secondaryButton} !px-3 !py-1.5 text-sm`}>
                    Mua thêm
                  </Link>
                  <Link href="/cart" className={`${primaryButton} !px-3 !py-1.5 text-sm`}>
                    Xem giỏ
                  </Link>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
