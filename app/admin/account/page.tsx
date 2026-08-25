import { auth } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/change-password-form";

export default async function AdminAccountPage() {
  const session = await auth();

  return (
    <div className="max-w-[520px]">
      <h1 className="text-[32px] font-bold">Account</h1>
      <p className="mt-2 text-muted">{session?.user?.name ?? "Admin"} · {session?.user?.email}</p>

      <div className="mt-6 rounded-[20px] border border-line bg-white p-[26px]">
        <h3 className="text-[18px] font-semibold">Change password</h3>
        <p className="mt-1 text-[13.5px] text-muted">Do this now if you're using a seeded default password.</p>
        <div className="mt-5">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
