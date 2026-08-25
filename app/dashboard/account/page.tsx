import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DefaultDeliveryToggle } from "@/components/default-delivery-toggle";
import { AccountPrivacyActions } from "@/components/account-privacy-actions";
import { ChangePasswordForm } from "@/components/change-password-form";

export default async function DashboardAccountPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({ where: { id: session!.user.id } });

  return (
    <div className="max-w-[640px]">
      <h1 className="text-[32px] font-bold">Account</h1>

      <div className="mt-6 grid gap-4 rounded-[20px] border border-line bg-white p-[26px]">
        <div>
          <div className="mb-[6px] text-[13px] font-semibold text-muted">Name</div>
          <input readOnly value={user?.name ?? ""} className="w-full rounded-[11px] border border-line3 px-[14px] py-[13px] outline-none" />
        </div>
        <div>
          <div className="mb-[6px] text-[13px] font-semibold text-muted">Email</div>
          <input readOnly value={user?.email ?? ""} className="w-full rounded-[11px] border border-line3 px-[14px] py-[13px] outline-none" />
        </div>
        <div>
          <div className="mb-[6px] text-[13px] font-semibold text-muted">Default delivery</div>
          <DefaultDeliveryToggle />
        </div>
      </div>

      <div className="mt-[18px] rounded-[20px] border border-line bg-white p-[26px]">
        <h3 className="text-[18px] font-semibold">Change password</h3>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </div>

      <div className="mt-[18px] rounded-[20px] border border-line bg-white p-[26px]">
        <h3 className="text-[18px] font-semibold">Data and privacy</h3>
        <div className="mt-[14px] grid gap-[10px] text-[14px] text-muted">
          <div>Intake videos are transcribed to text. No facial or voice biometric data is stored.</div>
          <div>Raw video and transcripts follow a fixed retention window, encrypted at rest.</div>
        </div>
        <div className="mt-[18px]">
          <AccountPrivacyActions />
        </div>
      </div>
    </div>
  );
}
