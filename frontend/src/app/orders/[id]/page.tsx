"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import PaymentForm from "@/components/PaymentForm";
import { ErrorBox, primaryButton, secondaryButton, Spinner, StatusBadge } from "@/components/ui";
import { ProviderLogo } from "@/components/ProviderLogo";
import { api } from "@/lib/api";
import { formatDateTime, formatVND } from "@/lib/format";
import { useRequireAuth } from "@/lib/hooks";
import { startPayment } from "@/lib/payment";
import type { Order, OrderStatus, PaymentProvider } from "@/lib/types";

const IN_PROGRESS: OrderStatus[] = ["PAID", "PREPARING", "READY"];

const STATUS_NOTE: Partial<Record<OrderStatus, string>> = {
  PAID: "Quầy đã nhận thanh toán, đơn đang chờ pha.",
  PREPARING: "Barista đang pha nước của bạn.",
  READY: "Nước đã xong, mời bạn tới quầy lấy nước.",
};

export default function OrderPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <OrderConfirmation />
    </Suspense>
  );
}

function OrderConfirmation() {
  const token = useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const points = Number(useSearchParams().get("points") ?? 0);
  const queryClient = useQueryClient();
  const [payError, setPayError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: order, isPending, isError, error, refetch } = useQuery({
    queryKey: ["order", id],
    queryFn: () => api<Order>(`/orders/${id}`, { token }),
    enabled: !!token,
    // Đơn đang ở quầy thì tự cập nhật để khách thấy lúc nhân viên nhận đơn và pha xong
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && IN_PROGRESS.includes(status) ? 5000 : false;
    },
  });

  if (!token || isPending) return <Spinner />;
  if (isError) return <ErrorBox message={error.message} onRetry={() => refetch()} />;

  const success = order.status !== "PENDING" && order.status !== "PAYMENT_FAILED" && order.status !== "CANCELLED";
  const canPay = order.status === "PENDING" || order.status === "PAYMENT_FAILED";
  // Hủy được cho tới khi quầy bắt đầu pha; đơn đã trả tiền thì quầy hoàn tiền cho khách
  const canCancel = canPay || order.status === "PAID";
  const paid = order.payments[0];

  async function retryPayment(provider: PaymentProvider) {
    setBusy(true);
    setPayError(null);
    try {
      await startPayment(token, order!.id, provider);
      return;
    } catch (err) {
      setPayError((err as Error).message);
    }
    setBusy(false);
  }

  async function cancel() {
    const refund = order!.status === "PAID" ? "\nTiền đã thanh toán sẽ được hoàn tại quầy." : "";
    if (!confirm(`Hủy đơn #${order!.id}?${refund}`)) return;
    setBusy(true);
    try {
      queryClient.setQueryData(["order", id], await api<Order>(`/orders/${order!.id}/cancel`, { method: "POST", token }));
    } catch (err) {
      setPayError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-3xl border border-latte bg-white p-6 text-center">
        {success ? (
          <>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
              ✓
            </div>
            <h1 className="mt-4 text-2xl font-bold">Đặt hàng thành công</h1>
          </>
        ) : (
          <h1 className="text-2xl font-bold">Đơn hàng</h1>
        )}
        <p className="mt-3 text-lg">
          Mã đơn: <span className="font-mono font-bold">#{order.id}</span>
        </p>
        <div className="mt-2">
          <StatusBadge status={order.status} />
        </div>
        {STATUS_NOTE[order.status] && <p className="mt-4 font-medium text-roast">{STATUS_NOTE[order.status]}</p>}
        {points > 0 && success && (
          <p className="mt-2 text-sm text-emerald-800">Bạn vừa được cộng {points} điểm thưởng.</p>
        )}
        <p className="mt-2 text-sm text-roast">{formatDateTime(order.createdAt)}</p>
        {paid && (
          <Link
            href={`/payments/${paid.id}/receipt`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-latte px-3 py-2 text-sm font-medium hover:bg-latte"
          >
            <ProviderLogo provider={paid.provider} small />
            Xem biên lai thanh toán
          </Link>
        )}
      </div>

      <ul className="mt-6 divide-y divide-latte rounded-2xl border border-latte bg-white text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3 p-3">
            <span>
              <span className="font-medium">
                {item.productName} {item.size} × {item.qty}
              </span>
              {item.toppings.length > 0 && <span className="block text-roast">{item.toppings.join(", ")}</span>}
            </span>
            <span className="whitespace-nowrap">{formatVND(item.lineTotal)}</span>
          </li>
        ))}
        {order.discount > 0 && (
          <li className="flex justify-between p-3 text-emerald-800">
            <span>Mã {order.promotionCode}</span>
            <span>−{formatVND(order.discount)}</span>
          </li>
        )}
        <li className="flex justify-between p-3 text-base font-bold">
          <span>Tổng</span>
          <span>{formatVND(order.total)}</span>
        </li>
      </ul>

      {canPay && (
        <section className="mt-6 rounded-2xl border border-latte bg-white p-5">
          <h2 className="mb-3 font-semibold">Thanh toán đơn này</h2>
          <PaymentForm total={order.total} submitting={busy} error={payError} onPay={retryPayment} />
        </section>
      )}
      {!canPay && payError && (
        <div className="mt-4">
          <ErrorBox message={payError} />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={`${primaryButton} flex-1 text-center`}>
          Về trang chủ
        </Link>
        <Link href="/orders" className={`${secondaryButton} flex-1 text-center`}>
          Lịch sử đơn
        </Link>
      </div>
      {canCancel && (
        <button onClick={cancel} disabled={busy} className="mt-4 w-full text-sm text-red-700 hover:underline">
          Hủy đơn
        </button>
      )}
      {order.status === "PAID" && (
        <p className="mt-1 text-center text-xs text-roast">
          Chỉ hủy được trước khi quầy bắt đầu pha; tiền được hoàn tại quầy.
        </p>
      )}
    </div>
  );
}
