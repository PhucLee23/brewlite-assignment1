"use client";

import Link from "next/link";
import { useEffect } from "react";
import { primaryButton, secondaryButton } from "@/components/ui";

/** Trang lỗi chung: một trang bị lỗi khi hiển thị thì header vẫn còn, khách bấm Thử lại hoặc về menu. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
      <h1 className="text-xl font-bold text-red-800">Đã có lỗi xảy ra</h1>
      <p className="mt-2 text-red-800">Trang này chưa hiển thị được. Bạn thử lại hoặc quay về menu nhé.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button onClick={reset} className={primaryButton}>
          Thử lại
        </button>
        <Link href="/" className={secondaryButton}>
          Về menu
        </Link>
      </div>
    </div>
  );
}
