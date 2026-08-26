import { auth } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/change-password-form";

export default async function AdminAccountPage() {
  const session = await auth();

  const mustChange = session?.user?.mustChangePassword;

  return (
    <div className="max-w-[520px]">
      <h1 className="text-[32px] font-bold">Account</h1>
      <p className="mt-2 text-muted">{session?.user?.name ?? "Admin"} · {session?.user?.email}</p>

      {mustChange && (
        <div className="mt-5 rounded-[14px] border border-[#E0C468] bg-[#FBF3D9] px-4 py-3 text-[13.5px] text-[#6B5A1A]">
          Your account was just created with a temporary password. Set a new one below before continuing.
        </div>
      )}

      <div className="mt-6 rounded-[20px] border border-line bg-white p-[26px]">
        <h3 className="text-[18px] font-semibold">Change password</h3>
        <p className="mt-1 text-[13.5px] text-muted">Do this now if you're using a seeded or temporary password.</p>
        <div className="mt-5">
          <ChangePasswordForm redirectAfter={mustChange ? "/admin" : undefined} />
        </div>
      </div>
    </div>
  );
}
