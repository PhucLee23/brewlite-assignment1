"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { EmptyState, ErrorBox, primaryButton, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateTime, formatVND } from "@/lib/format";
import { useRequireAuth } from "@/lib/hooks";
import type { CounterReport, CounterStatus, OrderStatus } from "@/lib/types";
import { useAuth } from "@/store/auth";

const TABS: { status: CounterStatus; label: string; empty: string }[] = [
  { status: "PAID", label: "Chờ nhận", empty: "Chưa có đơn nào đã thanh toán đang chờ." },
  { status: "PREPARING", label: "Đang pha", empty: "Không có đơn nào đang pha." },
  { status: "READY", label: "Chờ giao", empty: "Không có đơn nào chờ giao khách." },
  { status: "COMPLETED", label: "Hoàn tất", empty: "Chưa có đơn nào hoàn tất." },
  { status: "CANCELLED", label: "Đã hủy", empty: "Chưa có đơn nào bị hủy." },
];

/** Nút chính của mỗi nhóm: bước kế tiếp theo sơ đồ trạng thái PAID → PREPARING → READY → COMPLETED. */
const NEXT_STEP: Partial<Record<CounterStatus, { to: OrderStatus; label: string }>> = {
  PAID: { to: "PREPARING", label: "Nhận đơn" },
  PREPARING: { to: "READY", label: "Pha xong" },
  READY: { to: "COMPLETED", label: "Đã giao khách" },
};

export default function CounterPage() {
  const token = useRequireAuth();
  const isStaff = useAuth((s) => s.user?.role === "STAFF");
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<CounterStatus>("PAID");

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["orders", "counter", tab],
    queryFn: () => api<CounterReport>(`/orders?status=${tab}`, { token }),
    enabled: !!token && isStaff,
    // Tự làm mới để đơn mới thanh toán hiện lên quầy mà không cần tải lại trang
    refetchInterval: 5000,
    placeholderData: keepPreviousData,
  });

  const change = useMutation({
    mutationFn: ({ id, to }: { id: number; to: OrderStatus }) =>
      api(`/orders/${id}/status`, { method: "PATCH", token, body: { status: to } }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["orders", "counter"] }),
  });

  if (!token) return <Spinner />;
  if (!isStaff) {
    return <EmptyState title="Trang Quầy chỉ dành cho nhân viên." action={{ href: "/", label: "Về Menu" }} />;
  }
  if (isPending) return <Spinner />;
  if (isError) return <ErrorBox message={error.message} onRetry={() => refetch()} />;

  const { counts, orders } = data;
  const current = TABS.find((t) => t.status === tab)!;
  const next = NEXT_STEP[tab];
  const busyId = change.isPending ? change.variables.id : null;

  function cancel(id: number) {
    const warning =
      `Hủy đơn #${id}? Khách đã thanh toán: nguyên liệu được trả về kho, điểm thưởng bị thu hồi ` +
      `và giao dịch chuyển sang mục "Cần hoàn tiền" trên trang Doanh thu.`;
    if (confirm(warning)) change.mutate({ id, to: "CANCELLED" });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Quầy pha chế</h1>
      <p className="mt-1 text-sm text-roast">
        Chỉ đơn đã thanh toán mới lên quầy, đơn trả tiền trước xếp trước.
      </p>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Nhóm đơn">
        {TABS.map((t) => (
          <button
            key={t.status}
            onClick={() => {
              change.reset();
              setTab(t.status);
            }}
            aria-pressed={tab === t.status}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              tab === t.status ? "border-espresso bg-espresso text-foam" : "border-latte bg-white hover:bg-latte"
            }`}
          >
            {t.label} ({counts[t.status]})
          </button>
        ))}
      </div>

      {change.isError && (
        <div className="mt-4">
          <ErrorBox message={change.error.message} />
        </div>
      )}

      {orders.length === 0 ? (
        <div className="mt-4">
          <EmptyState title={current.empty} />
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-2xl border border-latte bg-white p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-mono text-lg font-bold">#{order.id}</p>
                <p className="font-semibold">{formatVND(order.total)}</p>
              </div>
              <p className="text-sm text-roast">
                {order.user.fullName} · {formatDateTime(order.createdAt)}
              </p>

              <ul className="mt-3 space-y-1 text-sm">
                {order.items.map((item) => (
                  <li key={item.id}>
                    <span className="font-medium">
                      {item.productName} {item.size} × {item.qty}
                    </span>
                    {item.toppings.length > 0 && <span className="text-roast"> · {item.toppings.join(", ")}</span>}
                  </li>
                ))}
              </ul>

              {next && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    onClick={() => change.mutate({ id: order.id, to: next.to })}
                    disabled={busyId !== null}
                    className={`${primaryButton} py-2.5 sm:flex-1`}
                  >
                    {busyId === order.id ? "Đang cập nhật..." : next.label}
                  </button>
                  {/* Theo sơ đồ trạng thái, đơn chỉ hủy được trước khi barista nhận đơn */}
                  {tab === "PAID" && (
                    <button
                      onClick={() => cancel(order.id)}
                      disabled={busyId !== null}
                      className="rounded-xl px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      Hủy đơn
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
