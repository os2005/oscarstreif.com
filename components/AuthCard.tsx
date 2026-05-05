type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  tone?: "light" | "dark";
};

export function AuthCard({ title, description, children, tone = "light" }: AuthCardProps) {
  const isDark = tone === "dark";

  return (
    <div
      className={`p-6 backdrop-blur md:p-8 ${
        isDark ? "border border-paper/12 bg-white/[0.04] text-paper" : "border border-ink/15 bg-white/75 text-ink"
      }`}
    >
      <div className="mb-8 max-w-2xl">
        <h2 className="font-display text-3xl leading-tight md:text-4xl">{title}</h2>
        <p className={`mt-3 text-base leading-7 ${isDark ? "text-paper/68" : "text-ink/68"}`}>{description}</p>
      </div>
      {children}
    </div>
  );
}
