type PageTitleProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export function PageTitle({ eyebrow, title, subtitle }: PageTitleProps) {
  return (
    <header>
      {eyebrow ? <p className="mb-0.5 text-xs text-muted">{eyebrow}</p> : null}
      <h1 className="m-0 text-[25px] font-extrabold tracking-[-0.8px] text-ink">{title}</h1>
      {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
    </header>
  );
}
