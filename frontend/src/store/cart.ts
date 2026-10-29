import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Size, Topping } from "@/lib/types";

export interface CartItem {
  /** Cùng sản phẩm + size + topping thì gộp chung một dòng. */
  key: string;
  productId: number;
  name: string;
  imageUrl: string;
  size: Size;
  toppings: Topping[];
  unitPrice: number;
  qty: number;
}

export const MAX_QTY = 20;

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, "key">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

export function cartKey(productId: number, size: Size, toppings: Topping[]): string {
  return [productId, size, ...toppings.map((t) => t.id).sort((a, b) => a - b)].join("-");
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const key = cartKey(item.productId, item.size, item.toppings);
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, qty: Math.min(MAX_QTY, i.qty + item.qty) } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, key }] };
        }),
      setQty: (key, qty) =>
        set((state) => ({
          items: state.items.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : i)),
        })),
      remove: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
    }),
    { name: "brewlite-cart" },
  ),
);

export const selectCount = (s: CartState) => s.items.reduce((sum, i) => sum + i.qty, 0);
export const selectTotal = (s: CartState) => s.items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
