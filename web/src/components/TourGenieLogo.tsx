import { Compass } from "lucide-react";

export default function TourGenieLogo({ size = 40, iconClassName = "", animated = false }: { size?: number; iconClassName?: string; animated?: boolean }) {
  const ringInset = Math.max(2, Math.round(size * 0.075));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className={`absolute inset-0 rounded-full bg-linear-to-br from-sunset-400 to-sunset-600 ${animated ? "animate-sun-rotate" : ""}`} />
      <div
        className="absolute rounded-full bg-sand-50 flex items-center justify-center shadow-inner"
        style={{ inset: ringInset }}
      >
        <Compass className={iconClassName || "text-leaf-700"} strokeWidth={1.75} style={{ width: size * 0.5, height: size * 0.5 }} />
      </div>
    </div>
  );
}
