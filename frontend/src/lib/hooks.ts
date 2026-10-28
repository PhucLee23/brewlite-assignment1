"use client";

import { useEffect, useState } from "react";

/** true sau khi component đã mount ở trình duyệt (tránh lệch HTML khi đọc localStorage). */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
