"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { ProviderLogo, PROVIDERS } from "@/components/ProviderLogo";
import { EmptyState, ErrorBox, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateTime, formatVND } from "@/lib/format";
import { useRequireAuth } from "@/lib/hooks";
import type { PaymentState, RevenueReport } from "@/lib/types";
import { useAuth } from "@/store/auth";

const STATE_LABEL: Record<PaymentState, string> = {
  SUCCESS: "Thành công",
  REFUND_DUE: "Cần hoàn tiền",
  PROCESSING: "Đang chờ",
  FAILED: "Thất bại",
  EXPIRED: "Hết hạn",
};

const STATE_STYLE: Record<PaymentState, string> = {
  SUCCESS: "bg-emerald-100 text-emerald-900",
  REFUND_DUE: "bg-rose-100 text-rose-900",
  PROCESSING: "bg-amber-100 text-amber-900",
  FAILED: "bg-red-100 text-red-900",
  EXPIRED: "bg-stone-100 text-stone-500",
};

const AMOUNT_STYLE: Partial<Record<PaymentState, string>> = {
  SUCCESS: "text-emerald-700",
  REFUND_DUE: "text-rose-700 line-through",
};

const FILTERS: (PaymentState | null)[] = [null, "SUCCESS", "REFUND_DUE", "PROCESSING", "FAILED", "EXPIRED"];
const PAGE_SIZE = 100;

export default function RevenuePage() {
  const token = useRequireAuth();
  const isStaff = useAuth((s) => s.user?.role === "STAFF");
  const [filter, setFilter] = useState<PaymentState | null>(null);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["payments", "revenue", filter],
    queryFn: () => api<RevenueReport>(`/payments${filter ? `?status=${filter}` : ""}`, { token }),
    enabled: !!token && isStaff,
    // Tự làm mới để thấy tiền vào ngay khi cổng xác nhận
    refetchInterval: 5000,
    placeholderData: keepPreviousData,
  });

  if (!token) return <Spinner />;
  if (!isStaff) {
    return <EmptyState title="Trang Doanh thu chỉ dành cho nhân viên." action={{ href: "/", label: "Về Menu" }} />;
  }
  if (isPending) return <Spinner />;
  if (isError) return <ErrorBox message={error.message} onRetry={() => refetch()} />;

  const { summary, payments } = data;
  const counts: Record<PaymentState, number> = {
    SUCCESS: summary.success,
    REFUND_DUE: summary.refundDue,
    PROCESSING: summary.processing,
    FAILED: summary.failed,
    EXPIRED: summary.expired,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Doanh thu</h1>
      <p className="mt-1 text-sm text-roast">
        Tiền chỉ được tính khi cổng MoMo hoặc VNPay xác nhận thanh toán thành công và đơn không bị hủy.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 rounded-2xl bg-espresso p-4 text-foam sm:col-span-4">
          <p className="text-sm opacity-80">Tiền đã vào</p>
          <p className="mt-1 text-2xl font-bold">
            {formatVND(summary.received)}
          </p>
        </div>
        <SummaryCard label="Thành công" value={summary.success} />
        <SummaryCard
          label="Cần hoàn tiền"
          value={summary.refundDue}
          note={formatVND(summary.refundDueAmount)}
          alert={summary.refundDue > 0}
        />
        <SummaryCard label="Đang chờ" value={summary.processing} />
        <SummaryCard label="Thất bại" value={summary.failed} note={`${summary.expired} phiên hết hạn`} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Lọc theo trạng thái">
        {FILTERS.map((f) => (
          <button
            key={f ?? "ALL"}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              filter === f ? "border-espresso bg-espresso text-foam" : "border-latte bg-white hover:bg-latte"
            }`}
          >
            {f ? `${STATE_LABEL[f]} (${counts[f]})` : "Tất cả"}
          </button>
        ))}
      </div>

      {payments.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Chưa có giao dịch nào." />
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {payments.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-latte bg-white p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <ProviderLogo provider={p.provider} small />
                <div className="min-w-0">
                  <p className="truncate font-mono font-semibold">{p.gatewayRef ?? noRefLabel(p.state, p.id)}</p>
                  <p className="truncate text-sm text-roast">
                    Đơn #{p.orderId} · {p.order.user.fullName}
                    {p.bankCode || p.payType ? ` · ${[p.bankCode, p.payType?.toUpperCase()].filter(Boolean).join(" ")}` : ""}
                  </p>
                  <p className="text-xs text-roast">
                    {p.confirmedAt
                      ? `${p.provider ? PROVIDERS[p.provider].name : "Cổng"} xác nhận lúc ${formatDateTime(p.confirmedAt)}`
                      : `Mở phiên lúc ${formatDateTime(p.createdAt)}`}
                  </p>
                  {p.state === "REFUND_DUE" && (
                    <p className="mt-1 text-sm font-medium text-rose-700">Đơn đã hủy – cần hoàn tiền cho khách</p>
                  )}
                </div>
              </div>
              <div className="flex flex-none flex-col items-end gap-1">
                <span className={`font-semibold ${AMOUNT_STYLE[p.state] ?? "text-roast"}`}>
                  {p.state === "SUCCESS" ? "+" : ""}
                  {formatVND(p.amount)}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATE_STYLE[p.state]}`}>
                  {STATE_LABEL[p.state]}
                </span>
                {p.confirmedAt && (
                  <Link href={`/payments/${p.id}/receipt`} className="text-xs font-medium underline">
                    Biên lai
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {payments.length === PAGE_SIZE && (
        <p className="mt-3 text-center text-sm text-roast">Đang hiện {PAGE_SIZE} giao dịch gần nhất.</p>
      )}
    </div>
  );
}

/** Phiên chưa kết thúc thì chưa có mã giao dịch của cổng; giao dịch không có mã thì hiện mã nội bộ. */
function noRefLabel(state: PaymentState, id: number) {
  return state === "PROCESSING" || state === "EXPIRED" ? "Chưa có mã giao dịch" : `Giao dịch #${id}`;
}

function SummaryCard({ label, value, note, alert }: { label: string; value: number; note?: string; alert?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${alert ? "border-rose-300 bg-rose-50 text-rose-900" : "border-latte bg-white"}`}>
      <p className={`text-sm ${alert ? "" : "text-roast"}`}>{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {note && <p className={`text-xs ${alert ? "" : "text-roast"}`}>{note}</p>}
    </div>
  );
}
