"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ProviderLogo, PROVIDERS } from "@/components/ProviderLogo";
import { ErrorBox, secondaryButton, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateTime, formatVND } from "@/lib/format";
import { useRequireAuth } from "@/lib/hooks";
import type { PaymentState, Receipt } from "@/lib/types";
import { useAuth } from "@/store/auth";

const RESULT: Record<PaymentState, { title: string; icon: string; style: string }> = {
  SUCCESS: { title: "Giao dịch thành công", icon: "✓", style: "bg-emerald-100 text-emerald-700" },
  REFUND_DUE: { title: "Đã thanh toán – đơn đã hủy, chờ hoàn tiền", icon: "↺", style: "bg-rose-100 text-rose-700" },
  FAILED: { title: "Giao dịch không thành công", icon: "✕", style: "bg-red-100 text-red-700" },
  PROCESSING: { title: "Giao dịch đang chờ xác nhận", icon: "…", style: "bg-amber-100 text-amber-700" },
  EXPIRED: { title: "Phiên thanh toán đã hết hạn", icon: "…", style: "bg-stone-100 text-stone-500" },
};

/** Biên lai: bằng chứng giao dịch do cổng MoMo/VNPay xác nhận. In hoặc lưu PDF bằng nút In của trình duyệt. */
export default function ReceiptPage() {
  const token = useRequireAuth();
  const isStaff = useAuth((s) => s.user?.role === "STAFF");
  const { id } = useParams<{ id: string }>();
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["receipt", id],
    queryFn: () => api<Receipt>(`/payments/${id}/receipt`, { token }),
    enabled: !!token,
  });

  if (!token || isPending) return <Spinner />;
  if (isError) return <ErrorBox message={error.message} onRetry={() => refetch()} />;

  const { payment, order, customer, gatewayResult } = data;
  const brand = payment.provider ? PROVIDERS[payment.provider] : null;
  const result = RESULT[payment.state];

  return (
    <div className="mx-auto max-w-md">
      <article className="overflow-hidden rounded-3xl border border-latte bg-white print:border-0">
        <header className="flex items-center gap-3 px-5 py-4 text-white" style={{ background: brand?.color ?? "#3b2416" }}>
          <ProviderLogo provider={payment.provider} />
          <div>
            <p className="font-semibold">Biên lai thanh toán {brand?.name}</p>
            <p className="text-xs opacity-80">Môi trường thử nghiệm (sandbox)</p>
          </div>
        </header>

        <div className="p-5 text-center">
          <div className={`mx-auto grid h-14 w-14 place-items-center rounded-full text-2xl font-bold ${result.style}`}>
            {result.icon}
          </div>
          <h1 className="mt-3 text-lg font-bold">{result.title}</h1>
          <p className="mt-1 text-3xl font-bold" style={{ color: brand?.color }}>
            {formatVND(payment.amount)}
          </p>
        </div>

        <dl className="divide-y divide-latte border-y border-latte px-5 text-sm">
          <Row label="Cổng thanh toán" value={brand?.name ?? "—"} />
          <Row label={`Mã giao dịch ${brand?.name ?? ""}`} value={payment.gatewayRef ?? "Chưa có"} mono />
          <Row label="Mã đơn gửi cổng" value={payment.gatewayOrderId ?? "—"} mono />
          {payment.bankCode && <Row label="Ngân hàng" value={payment.bankCode} />}
          {payment.payType && <Row label="Hình thức" value={payment.payType.toUpperCase()} />}
          <Row label="Thời gian xác nhận" value={payment.confirmedAt ? formatDateTime(payment.confirmedAt) : "—"} />
          <Row label="Nhà cung cấp" value="BrewLite" />
          <Row label="Đơn hàng" value={`#${order.id}`} />
          <Row label="Khách hàng" value={`${customer.fullName} (${customer.email})`} />
        </dl>

        <ul className="px-5 py-3 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 py-1">
              <span>
                {item.productName} {item.size} × {item.qty}
                {item.toppings.length > 0 && <span className="text-roast"> · {item.toppings.join(", ")}</span>}
              </span>
              <span className="whitespace-nowrap">{formatVND(item.lineTotal)}</span>
            </li>
          ))}
          {order.discount > 0 && (
            <li className="flex justify-between py-1 text-emerald-800">
              <span>Mã {order.promotionCode}</span>
              <span>−{formatVND(order.discount)}</span>
            </li>
          )}
          <li className="mt-1 flex justify-between border-t border-latte pt-2 font-bold">
            <span>Tổng</span>
            <span>{formatVND(order.total)}</span>
          </li>
        </ul>

        {gatewayResult && (
          <details className="border-t border-latte px-5 py-3 text-xs text-roast print:hidden">
            <summary className="cursor-pointer">Dữ liệu gốc {brand?.name} gửi về (có chữ ký của cổng)</summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-foam p-2">
              {JSON.stringify(gatewayResult, null, 2)}
            </pre>
          </details>
        )}
      </article>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row print:hidden">
        <button
          onClick={() => window.print()}
          className="flex-1 rounded-xl px-5 py-3 font-semibold text-white hover:opacity-90"
          style={{ background: brand?.color ?? "#3b2416" }}
        >
          In / Lưu PDF
        </button>
        <Link
          href={isStaff ? "/admin/revenue" : `/orders/${order.id}`}
          className={`${secondaryButton} flex-1 text-center`}
        >
          {isStaff ? "Về Doanh thu" : "Về đơn hàng"}
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-roast">{label}</dt>
      <dd className={`text-right font-medium ${mono ? "break-all font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
