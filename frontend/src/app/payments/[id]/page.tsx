"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import PaymentForm from "@/components/PaymentForm";
import { ProviderLogo, PROVIDERS } from "@/components/ProviderLogo";
import { ErrorBox, secondaryButton, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { formatVND } from "@/lib/format";
import { useRequireAuth } from "@/lib/hooks";
import { forgetOrderKey } from "@/lib/orderKey";
import { startPayment } from "@/lib/payment";
import type { PaymentProvider, PaymentSession, User } from "@/lib/types";
import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";

/** Hỏi backend mỗi 1,5 giây; backend tự tra cứu cổng nên khách trả bằng app trên điện thoại vẫn thấy kết quả. */
const POLL_MS = 1_500;

export default function PaymentPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <PaymentStatus />
    </Suspense>
  );
}

/**
 * Trang chờ kết quả thanh toán. Cổng MoMo/VNPay chuyển khách về đây kèm kết quả có chữ ký;
 * trang chỉ chuyển tham số đó cho backend. Backend kiểm tra chữ ký và hỏi lại cổng rồi mới đổi trạng thái đơn.
 */
function PaymentStatus() {
  const token = useRequireAuth();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const clearCart = useCart((s) => s.clear);
  const setUser = useAuth((s) => s.setUser);
  const [now, setNow] = useState(() => Date.now());
  const [returnError, setReturnError] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Tham số cổng gắn vào link khi chuyển khách về (VNPay: vnp_*, MoMo: partnerCode, signature...)
  const callback = Object.fromEntries(searchParams.entries());
  const fromGateway = "vnp_SecureHash" in callback || ("partnerCode" in callback && "signature" in callback);
  const sent = useRef(false);

  useEffect(() => {
    if (!token || !fromGateway || sent.current) return;
    sent.current = true;
    api<PaymentSession>(`/payments/${id}/return`, { method: "POST", token, body: { params: callback } })
      .then((session) => queryClient.setQueryData(["payment", id], session))
      .catch((err) => setReturnError((err as Error).message))
      // Bỏ tham số khỏi thanh địa chỉ để tải lại trang không gửi lại kết quả cũ
      .finally(() => router.replace(`/payments/${id}`));
  }, [token, fromGateway]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: session, isPending, isError, error, refetch } = useQuery({
    queryKey: ["payment", id],
    queryFn: () => api<PaymentSession>(`/payments/${id}`, { token }),
    enabled: !!token && !fromGateway,
    // Phiên còn mở thì tiếp tục hỏi
    refetchInterval: (query) => (query.state.data?.paymentUrl ? POLL_MS : false),
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const order = session?.order;
  useEffect(() => {
    if (order?.status !== "PAID" || !token) return;
    clearCart();
    forgetOrderKey();
    api<User>("/auth/me", { token }).then(setUser).catch(() => {});
    // 1 điểm thưởng cho mỗi 1.000đ, giống backend
    router.replace(`/orders/${order.id}?points=${Math.floor(order.total / 1000)}`);
  }, [order, token, clearCart, setUser, router]);

  async function pay(provider: PaymentProvider) {
    setBusy(true);
    setPayError(null);
    try {
      await startPayment(token, session!.order.id, provider);
      return;
    } catch (err) {
      setPayError((err as Error).message);
    }
    setBusy(false);
  }

  if (!token || fromGateway) return <Spinner label="Đang xác nhận kết quả với cổng thanh toán..." />;
  if (isPending) return <Spinner />;
  if (isError) return <ErrorBox message={error.message} onRetry={() => refetch()} />;
  if (session.order.status === "PAID") return <Spinner label="Thanh toán thành công, đang mở đơn hàng..." />;

  const provider = session.payment.provider;
  const brand = provider ? PROVIDERS[provider] : null;
  const secondsLeft = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - now) / 1000));

  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-latte bg-white">
      {/* Thanh tiêu đề theo màu của cổng, giống trang thanh toán của MoMo/VNPay */}
      <div className="flex items-center gap-3 px-5 py-4 text-white" style={{ background: brand?.color ?? "#3b2416" }}>
        <ProviderLogo provider={provider} />
        <div>
          <p className="font-semibold">Cổng thanh toán {brand?.name ?? ""}</p>
          <p className="text-xs opacity-80">Môi trường thử nghiệm (sandbox)</p>
        </div>
      </div>

      <div className="grid gap-6 p-5 md:grid-cols-[1fr_1.1fr]">
        <section className="rounded-2xl bg-foam p-4">
          <h2 className="font-semibold">Thông tin đơn hàng</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <Row label="Nhà cung cấp" value="BrewLite" />
            <Row label="Mã đơn hàng" value={`#${session.order.id}`} />
            {session.payment.gatewayOrderId && <Row label={`Mã giao dịch gửi ${brand?.name}`} value={session.payment.gatewayOrderId} mono />}
            <div>
              <dt className="text-roast">Số tiền</dt>
              <dd className="text-2xl font-bold" style={{ color: brand?.color }}>
                {formatVND(session.payment.amount)}
              </dd>
            </div>
          </dl>
          {session.paymentUrl && (
            <p className="mt-4 text-sm">
              Đơn hàng sẽ hết hạn sau{" "}
              <b className="rounded bg-espresso px-1.5 py-0.5 font-mono text-foam">
                {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}
              </b>
            </p>
          )}
        </section>

        <section className="flex flex-col justify-center">
          {returnError && (
            <div className="mb-4">
              <ErrorBox message={returnError} />
            </div>
          )}
          {session.paymentUrl ? (
            <>
              <h1 className="text-xl font-bold">Đang chờ {brand?.name} xác nhận</h1>
              <p className="mt-2 text-sm text-roast">
                Hoàn tất trên trang {brand?.name}. Nếu bạn đã trả bằng app trên điện thoại, trang này tự cập nhật khi{" "}
                {brand?.name} xác nhận.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-roast">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500" />
                Đang kiểm tra với {brand?.name}...
              </div>
              <a
                href={session.paymentUrl}
                className="mt-5 rounded-xl px-5 py-3 text-center font-semibold text-white hover:opacity-90"
                style={{ background: brand?.color }}
              >
                Tiếp tục thanh toán trên {brand?.name}
              </a>
              <Link href={`/orders/${session.order.id}`} className={`${secondaryButton} mt-3 text-center`}>
                Xem đơn hàng
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold">
                {session.order.status === "PAYMENT_FAILED"
                  ? "Thanh toán không thành công"
                  : session.order.status === "PENDING"
                    ? "Phiên thanh toán đã hết hạn"
                    : `Đơn #${session.order.id} không còn chờ thanh toán`}
              </h1>
              {session.order.status === "PENDING" || session.order.status === "PAYMENT_FAILED" ? (
                <>
                  <p className="mb-4 mt-2 text-sm text-roast">
                    Đơn #{session.order.id} chưa được thanh toán, giỏ hàng vẫn giữ nguyên. Chọn cổng để thanh toán lại.
                  </p>
                  <PaymentForm total={session.order.total} submitting={busy} error={payError} onPay={pay} />
                </>
              ) : (
                <Link href={`/orders/${session.order.id}`} className={`${secondaryButton} mt-4 text-center`}>
                  Xem đơn hàng
                </Link>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-roast">{label}</dt>
      <dd className={`font-semibold ${mono ? "break-all font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
