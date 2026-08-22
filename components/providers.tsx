"use client";

import { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/components/cart-context";
import { ToastProvider } from "@/components/toast-context";
import { PageViewTracker } from "@/components/page-view-tracker";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <ToastProvider>
          <Suspense fallback={null}>
            <PageViewTracker />
          </Suspense>
          {children}
        </ToastProvider>
      </CartProvider>
    </SessionProvider>
  );
}
