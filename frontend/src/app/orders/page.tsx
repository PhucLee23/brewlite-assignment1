"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { EmptyState, ErrorBox, Spinner, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateTime, formatVND } from "@/lib/format";
import { useRequireAuth } from "@/lib/hooks";
import type { Order } from "@/lib/types";

export default function OrderHistoryPage() {
  const token = useRequireAuth();
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["orders", "me"],
    queryFn: () => api<Order[]>("/orders/me", { token }),
    enabled: !!token,
  });

  if (!token || isPending) return <Spinner />;
  if (isError) return <ErrorBox message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Lịch sử đơn hàng</h1>
      {data.length === 0 ? (
        <EmptyState title="Bạn chưa có đơn hàng nào." action={{ href: "/", label: "Đặt món đầu tiên" }} />
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-latte bg-white p-4 transition hover:bg-latte/40"
              >
                <div className="min-w-0">
                  <p className="font-semibold">
                    <span className="font-mono">#{order.id}</span>{" "}
                    <span className="font-normal text-roast">· {formatDateTime(order.createdAt)}</span>
                  </p>
                  <p className="truncate text-sm text-roast">
                    {order.items.map((i) => `${i.productName} ${i.size}×${i.qty}`).join(", ")}
                  </p>
                </div>
                <div className="flex flex-none flex-col items-end gap-1">
                  <span className="font-semibold">{formatVND(order.total)}</span>
                  <StatusBadge status={order.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
