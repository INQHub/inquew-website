import { prisma } from "@/lib/prisma";
import { UserRowControls } from "@/components/admin/user-row-controls";
import { NewUserForm } from "@/components/admin/new-user-form";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="text-[32px] font-bold">Users</h1>
      <p className="mt-2 text-muted">{users.length} accounts.</p>

      <div className="mt-6">
        <NewUserForm />
      </div>

      <div className="overflow-x-auto rounded-[20px] border border-line bg-white">
        <table className="w-full min-w-[640px] text-[14px]">
          <thead>
            <tr className="border-b border-line2 bg-sand text-left text-[11.5px] font-bold uppercase tracking-[0.06em] text-faint">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Last login</th>
              <th className="px-5 py-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[#F3F1E7]">
                <td className="px-5 py-3 font-semibold">{u.name ?? "—"}</td>
                <td className="px-5 py-3 text-muted">{u.email}</td>
                <td className="px-5 py-3">
                  {u.active ? "Active" : "Deactivated"}
                  {u.mustChangePassword && <span className="ml-2 text-[11.5px] font-semibold text-olive">Pending password</span>}
                </td>
                <td className="px-5 py-3 text-muted">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Never"}
                </td>
                <td className="px-5 py-3">
                  <UserRowControls userId={u.id} role={u.role} active={u.active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
