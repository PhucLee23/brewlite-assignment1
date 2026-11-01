import type { Metadata } from "next";
import Link from "next/link";
import { primaryButton } from "@/components/ui";

export const metadata: Metadata = { title: "Không tìm thấy trang – BrewLite" };

/** Hiện khi gõ sai địa chỉ, thay cho trang 404 tiếng Anh mặc định của Next.js. */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-dashed border-latte bg-white p-10 text-center">
      <p className="text-5xl font-bold text-crema">404</p>
      <h1 className="mt-3 text-xl font-bold">Không tìm thấy trang</h1>
      <p className="mt-2 text-roast">Địa chỉ bạn mở không tồn tại hoặc đã bị đổi.</p>
      <Link href="/" className={`${primaryButton} mt-6 inline-block`}>
        Về menu
      </Link>
    </div>
  );
}
