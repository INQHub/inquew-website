import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function OrderConfirmationPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || (order.userId !== session.user.id && session.user.role !== "ADMIN")) notFound();

  const isPending = order.status === "PENDING_PAYMENT";
  const deliveryNote =
    order.deliveryMethod === "EMAIL"
      ? "It will arrive as a secure, expiring link once review is complete."
      : "It will be posted to your dashboard once review is complete.";

  return (
    <section className="mx-auto max-w-[760px] px-7 py-20">
      <div className="rounded-3xl border border-line bg-white p-12 text-center shadow-[0_10px_34px_rgba(66,82,6,.07)]">
        <div className="mx-auto flex h-[58px] w-[58px] items-center justify-center rounded-full" style={{ background: isPending ? "#978E4C" : "#2D7B5F" }}>
          <span className="mt-[-4px] h-[11px] w-5 -rotate-45 border-b-[3px] border-l-[3px] border-white" />
        </div>
        <h1 className="mt-[22px] text-[36px] font-bold">{isPending ? "Confirming your payment" : "Order placed"}</h1>
        <p className="mt-[14px] text-[17px] text-muted">
          Order {order.displayId} {isPending ? "is being confirmed." : "is with a consultant."} {!isPending && deliveryNote}
        </p>
        {isPending && (
          <p className="mt-2 text-[13.5px] text-faint">
            This page updates once Stripe confirms the charge — refresh in a moment, or check your dashboard.
          </p>
        )}
        <div className="mt-7 rounded-[18px] border border-line2 bg-sand p-[22px] text-left">
          <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-faint">What happens next</div>
          <div className="mt-3 grid gap-[9px] text-[14.5px]">
            <div>1. A consultant is assigned and begins the work, AI-assisted.</div>
            <div>2. A reviewer signs off before anything is released.</div>
            <div>3. You receive it, with your tier&apos;s edit credits ready to use.</div>
          </div>
        </div>
        <div className="mt-[30px] flex flex-wrap justify-center gap-[14px]">
          <Link href="/dashboard" className="rounded-xl bg-cyan px-6 py-[15px] font-semibold text-cyan-ink">
            Open my dashboard
          </Link>
          <Link href="/deliverables" className="rounded-xl border border-[#CFD8B8] bg-white px-6 py-[15px] font-semibold">
            Back to the menu
          </Link>
        </div>
      </div>
    </section>
  );
}
