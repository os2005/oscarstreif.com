type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <div className="border border-ink/15 bg-white/75 p-6 backdrop-blur md:p-8">
      <div className="mb-8 max-w-2xl">
        <h2 className="font-display text-3xl leading-tight md:text-4xl">{title}</h2>
        <p className="mt-3 text-base leading-7 text-ink/68">{description}</p>
      </div>
      {children}
    </div>
  );
}
