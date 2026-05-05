const linkedInUrl = "https://www.linkedin.com/in/oscar-streif-9681262b1/";

export function ContactLinks() {
  return (
    <div className="flex flex-wrap gap-4 border-t border-ink/15 pt-6 font-mono text-xs uppercase tracking-[0.2em]">
      <a className="transition hover:text-accent" href="mailto:os.streif@gmail.com">
        os.streif@gmail.com
      </a>
      <a className="transition hover:text-accent" href={linkedInUrl} rel="noreferrer" target="_blank">
        LinkedIn
      </a>
    </div>
  );
}
