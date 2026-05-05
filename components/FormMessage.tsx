type FormMessageProps = {
  kind: "error" | "success";
  children: React.ReactNode;
};

export function FormMessage({ kind, children }: FormMessageProps) {
  const styles =
    kind === "error"
      ? "border-red-400/45 bg-red-50 text-red-900"
      : "border-emerald-500/35 bg-emerald-50 text-emerald-950";

  return <div className={`mb-5 border px-4 py-3 text-sm leading-6 ${styles}`}>{children}</div>;
}
