interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  className?: string;
}

export const SectionHeading = ({ eyebrow, title, className = "mb-10 md:mb-14" }: SectionHeadingProps) => (
  <div className={className}>
    <p className="font-condensed text-accent text-xs tracking-[0.45em] uppercase mb-3">{eyebrow}</p>
    <h2 className="font-display font-bold text-foreground text-[clamp(2.5rem,6vw,5rem)] leading-none">
      {title}
    </h2>
  </div>
);
