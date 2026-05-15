interface PageHeaderProps {
  title: string;
  subtitle?: string;
  accentColor: string;
}

export default function PageHeader({
  title,
  subtitle,
  accentColor,
}: PageHeaderProps) {
  return (
    <header className="px-4 pt-12 pb-4">
      <div
        className="w-8 h-1 rounded-full mb-3"
        style={{ backgroundColor: accentColor }}
      />
      <h1 className="text-2xl font-bold text-text-primary tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
      )}
    </header>
  );
}
