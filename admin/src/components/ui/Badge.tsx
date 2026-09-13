import { cls } from "../../utils/helpers";

export default function Badge({ status }: { status: string }) {
    const styles: Record<string, string> = {
            confirmed: "bg-leaf-700/10 text-leaf-700 border border-leaf-700/20",
            cancelled: "bg-red-500/10 text-red-700 border border-red-200",
            admin: "bg-sunset-500/15 text-sunset-600 border border-sunset-400/30",
            user: "bg-ocean-500/10 text-ocean-500 border border-ocean-500/20",
            active: "bg-leaf-700/10 text-leaf-700 border border-leaf-700/20",
            inactive: "bg-sand-200 text-ink-800/50 border border-sand-200",
            planned: "bg-ocean-500/10 text-ocean-500 border border-ocean-500/20",
            completed: "bg-leaf-700/10 text-leaf-700 border border-leaf-700/20",
            draft: "bg-sand-200 text-ink-800/50 border border-sand-200",
            driving: "bg-sunset-500/15 text-sunset-600 border border-sunset-400/30",
            cycling: "bg-leaf-700/10 text-leaf-700 border border-leaf-700/20",
            walking: "bg-ocean-500/10 text-ocean-500 border border-ocean-500/20",
          };
    return (
    <span className={cls("text-[11px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide",
      styles[status] ?? "bg-red-500 text-white border border-red-700")}>
      {status}
    </span>
    );
}
