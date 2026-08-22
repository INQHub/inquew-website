"use client";

import { useRouter } from "next/navigation";

export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const close = () => router.back();

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-[rgba(38,48,10,.45)] px-5 py-10 backdrop-blur-[3px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[800px] overflow-hidden rounded-3xl bg-paper shadow-[0_30px_70px_rgba(26,33,6,.35)]"
      >
        {children}
      </div>
    </div>
  );
}
