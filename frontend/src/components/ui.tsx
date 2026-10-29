import Link from "next/link";
import { STATUS_LABEL } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export function Spinner({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-roast">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-crema border-t-transparent" />
      {label}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 font-medium underline">
          Thử lại
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, action }: { title: string; action?: { href: string; label: string } }) {
  return (
    <div className="rounded-2xl border border-dashed border-latte bg-white p-10 text-center">
      <p className="text-roast">{title}</p>
      {action && (
        <Link href={action.href} className="mt-4 inline-block rounded-xl bg-espresso px-5 py-2.5 font-medium text-foam">
          {action.label}
        </Link>
      )}
    </div>
  );
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  PAID: "bg-emerald-100 text-emerald-900",
  PREPARING: "bg-sky-100 text-sky-900",
  READY: "bg-indigo-100 text-indigo-900",
  COMPLETED: "bg-stone-200 text-stone-800",
  PAYMENT_FAILED: "bg-red-100 text-red-900",
  CANCELLED: "bg-stone-100 text-stone-500",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
      <span className="font-mono font-normal opacity-70">{status}</span>
    </span>
  );
}

export const primaryButton =
  "rounded-xl bg-espresso px-5 py-3 font-semibold text-foam transition hover:bg-roast disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButton =
  "rounded-xl border border-espresso/20 bg-white px-5 py-3 font-medium text-espresso transition hover:bg-latte disabled:opacity-50";
export const inputClass =
  "w-full rounded-xl border border-latte bg-white px-3.5 py-2.5 outline-none focus:border-crema focus:ring-2 focus:ring-crema/30";
