// Deliverable artwork: one Inquew mascot per category, on a soft brand tint. A real
// photo can replace it later by setting `imageUrl` on the deliverable.

const MASCOT_BY_CATEGORY: Record<string, string> = {
  "Diagnosis & Mapping": "document",
  "Measurement & Optimization": "calendar",
  "AI Enablement": "laptop",
  Advisory: "question",
  "Change Management": "circles",
  "Strategy & Roadmapping": "plane",
  "Process Redesign": "pen",
  Build: "city",
  "Founder Toolkit": "briefcase"
};

export function mascotFor(category?: string): string {
  return `/assets/mascots/${(category && MASCOT_BY_CATEGORY[category]) || "flame"}.png`;
}

export function PlaceholderArt({
  category,
  className = "",
  ratio
}: {
  category?: string;
  /** Kept for older call sites; the mascot is chosen by category. */
  keyword?: string;
  className?: string;
  ratio?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-[13px] bg-sand ${className}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      <img src={mascotFor(category)} alt="" className="h-[70%] max-h-[120px] w-auto object-contain" />
    </div>
  );
}
