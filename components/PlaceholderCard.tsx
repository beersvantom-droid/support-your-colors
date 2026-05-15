interface PlaceholderCardProps {
  title: string;
  description?: string;
  height?: "sm" | "md" | "lg";
  accentColor?: string;
}

const heightMap = {
  sm: "h-16",
  md: "h-24",
  lg: "h-40",
};

export default function PlaceholderCard({
  title,
  description,
  height = "md",
  accentColor,
}: PlaceholderCardProps) {
  return (
    <div className="bg-surface rounded-2xl p-4 shadow-sm border border-border">
      {accentColor && (
        <div
          className="w-5 h-1 rounded-full mb-3"
          style={{ backgroundColor: accentColor }}
        />
      )}
      <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">
        {title}
      </p>
      {description && (
        <p className="text-sm text-text-secondary mb-3">{description}</p>
      )}
      <div
        className={`${heightMap[height]} rounded-xl bg-muted animate-pulse`}
      />
    </div>
  );
}
