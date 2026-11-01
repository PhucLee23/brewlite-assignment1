"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import PaymentForm from "@/components/PaymentForm";
import { EmptyState, inputClass, secondaryButton, Spinner } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatVND } from "@/lib/format";
import { useRequireAuth } from "@/lib/hooks";
import { orderKeyFor } from "@/lib/orderKey";
import { startPayment } from "@/lib/payment";
import type { Order, PaymentProvider, PromotionCheck } from "@/lib/types";
import { useAuth } from "@/store/auth";
import { selectTotal, useCart } from "@/store/cart";

export default function CheckoutPage() {
  const token = useRequireAuth();
  const router = useRouter();
  const items = useCart((s) => s.items);
  const subtotal = useCart(selectTotal);
  const logout = useAuth((s) => s.logout);

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<Extract<PromotionCheck, { valid: true }> | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Cùng giỏ hàng + cùng mã giảm giá → cùng key, nên bấm thanh toán lại (kể cả sau khi từ cổng quay về)
  // không tạo đơn thứ hai
  const cartSignature = JSON.stringify([items.map((i) => [i.key, i.qty]), promo?.code]);
  // Giỏ chưa đọc xong từ localStorage thì đang rỗng: chưa lấy key, kẻo ghi đè key của giỏ thật
  const orderKey = useMemo(() => (items.length > 0 ? orderKeyFor(cartSignature) : ""), [cartSignature]); // eslint-disable-line react-hooks/exhaustive-deps

  // Giỏ đổi thì phải kiểm tra lại mã giảm giá theo tổng mới
  useEffect(() => setPromo(null), [subtotal]);

  if (!token) return <Spinner />;
  if (items.length === 0) return <EmptyState title="Giỏ hàng đang trống." action={{ href: "/", label: "Xem menu" }} />;

  const discount = promo?.discount ?? 0;
  const total = subtotal - discount;

  async function applyPromo(e: FormEvent) {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setPromoError(null);
    try {
      const res = await api<PromotionCheck>(
        `/promotions/${encodeURIComponent(promoInput.trim())}?subtotal=${subtotal}`,
      );
      if (res.valid) setPromo(res);
      else setPromoError(res.reason);
    } catch (err) {
      setPromoError((err as Error).message);
    }
  }

  async function pay(provider: PaymentProvider) {
    setSubmitting(true);
    setError(null);
    try {
      const order = await api<Order>("/orders", {
        method: "POST",
        token,
        idempotencyKey: orderKey,
        body: {
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            toppingIds: i.toppings.map((t) => t.id),
            qty: i.qty,
          })),
          promoCode: promo?.code,
        },
      });
      // Sang trang thanh toán của cổng. Giỏ hàng giữ nguyên; chỉ xóa khi cổng đã xác nhận thanh toán thành công
      await startPayment(token, order.id, provider);
      return;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        router.replace("/login?next=/checkout");
        return;
      }
      setError((err as Error).message);
    }
    setSubmitting(false);
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-[1fr_1.1fr]">
      <section>
        <h1 className="mb-4 text-2xl font-bold">Thanh toán</h1>
        <ul className="divide-y divide-latte rounded-2xl border border-latte bg-white">
          {items.map((i) => (
            <li key={i.key} className="flex justify-between gap-3 p-3 text-sm">
              <span>
                <span className="font-medium">
                  {i.name} {i.size} × {i.qty}
                </span>
                {i.toppings.length > 0 && (
                  <span className="block text-roast">{i.toppings.map((t) => t.name).join(", ")}</span>
                )}
              </span>
              <span className="whitespace-nowrap">{formatVND(i.unitPrice * i.qty)}</span>
            </li>
          ))}
        </ul>

        <form onSubmit={applyPromo} className="mt-4 flex gap-2">
          <input
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
            placeholder="Mã giảm giá (VD: BREW10)"
            className={inputClass}
            maxLength={32}
          />
          <button type="submit" className={`${secondaryButton} !py-2.5 whitespace-nowrap`}>
            Áp dụng
          </button>
        </form>
        {promoError && <p className="mt-2 text-sm text-red-700">{promoError}</p>}
        {promo && (
          <p className="mt-2 flex justify-between text-sm text-emerald-800">
            <span>
              Đã áp mã <b>{promo.code}</b> (−{promo.percentOff}%)
            </span>
            <button onClick={() => setPromo(null)} className="underline">
              Bỏ mã
            </button>
          </p>
        )}

        <dl className="mt-4 space-y-1 border-t border-latte pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-roast">Tạm tính</dt>
            <dd>{formatVND(subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-800">
              <dt>Giảm giá</dt>
              <dd>−{formatVND(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between pt-2 text-lg font-bold">
            <dt>Tổng</dt>
            <dd>{formatVND(total)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-latte bg-white p-5">
        <PaymentForm total={total} submitting={submitting} error={error} onPay={pay} />
      </section>
    </div>
  );
}
