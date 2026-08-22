export function PlaceholderArt({
  keyword,
  className = "",
  ratio
}: {
  keyword?: string;
  className?: string;
  ratio?: string;
}) {
  return (
    <div
      className={`placeholder-art relative flex items-end rounded-[13px] ${className}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      {keyword && (
        <span className="m-[10px] rounded-md bg-[rgba(253,252,249,.9)] px-[7px] py-[3px] font-mono text-[10px] tracking-[0.03em] text-faint">
          {keyword}
        </span>
      )}
    </div>
  );
}
