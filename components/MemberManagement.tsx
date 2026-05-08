import { deleteMemberAction, updateMemberRoleAction } from "@/app/private/actions";

type Member = {
  id: string;
  email: string;
  role: "admin" | "shared";
  createdAt: string;
};

type MemberManagementProps = {
  members: Member[];
  initialAdminEmail: string;
  initialError?: string | null;
};

export function MemberManagement({ members, initialAdminEmail, initialError = null }: MemberManagementProps) {
  const adminCount = members.filter((member) => member.role === "admin").length;

  return (
    <div className="space-y-4">
      {initialError ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-50">
          {initialError}
        </div>
      ) : null}
      {members.map((member) => {
        const isInitialAdmin = member.email === initialAdminEmail.toLowerCase();
        const isLastAdmin = member.role === "admin" && adminCount <= 1;
        const roleChangeDisabled = isInitialAdmin || isLastAdmin;
        const deleteDisabled = isInitialAdmin || isLastAdmin;

        return (
          <div className="rounded-3xl border border-paper/12 bg-black/20 p-5" key={member.id}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-lg text-paper">{member.email}</p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-paper/48">
                  {member.role} · added {new Date(member.createdAt).toLocaleDateString("en-GB")}
                </p>
              </div>
              <div className="flex flex-col gap-3 md:flex-row">
                <form action={updateMemberRoleAction} className="flex gap-3">
                  <input name="memberId" type="hidden" value={member.id} />
                  <select
                    className="rounded-full border border-paper/16 bg-black px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-paper outline-none disabled:opacity-40"
                    defaultValue={member.role}
                    disabled={roleChangeDisabled}
                    name="role"
                  >
                    <option value="shared">Shared</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    className="rounded-full border border-paper/16 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-paper transition hover:border-paper/40 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={roleChangeDisabled}
                    type="submit"
                  >
                    Save
                  </button>
                </form>
                <form action={deleteMemberAction}>
                  <input name="memberId" type="hidden" value={member.id} />
                  <button
                    className="rounded-full border border-red-400/30 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-red-100 transition hover:border-red-300/50 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={deleteDisabled}
                    type="submit"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
