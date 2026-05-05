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
};

export function MemberManagement({ members, initialAdminEmail }: MemberManagementProps) {
  return (
    <div className="space-y-4">
      {members.map((member) => {
        const isInitialAdmin = member.email === initialAdminEmail;

        return (
          <div className="border border-paper/14 bg-white/5 p-5" key={member.id}>
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
                    className="rounded-full border border-paper/16 bg-black px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-paper outline-none"
                    defaultValue={member.role}
                    disabled={isInitialAdmin}
                    name="role"
                  >
                    <option value="shared">Shared</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    className="rounded-full border border-paper/16 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-paper transition hover:border-paper/40 hover:bg-white/5 disabled:opacity-40"
                    disabled={isInitialAdmin}
                    type="submit"
                  >
                    Save
                  </button>
                </form>
                <form action={deleteMemberAction}>
                  <input name="memberId" type="hidden" value={member.id} />
                  <button
                    className="rounded-full border border-red-400/30 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-red-100 transition hover:border-red-300/50 hover:bg-red-400/10 disabled:opacity-40"
                    disabled={isInitialAdmin}
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
