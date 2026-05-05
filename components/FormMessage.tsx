type FormMessageProps = {
  kind: "error" | "success";
  children: React.ReactNode;
};

export function FormMessage({ kind, children }: FormMessageProps) {
  const styles =
    kind === "error"
      ? "border-red-400/28 bg-red-400/8 text-red-100"
      : "border-emerald-400/24 bg-emerald-400/8 text-emerald-100";

  return <div className={`mb-5 border px-4 py-3 text-sm leading-6 ${styles}`}>{children}</div>;
}
