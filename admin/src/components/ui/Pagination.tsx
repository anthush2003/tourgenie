import { ChevronLeft, ChevronRightIcon } from "lucide-react";
import { cls } from "../../utils/helpers";

export default function Pagination({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void }) {
    if (pages <= 1) return null;
    const items: (number | "…")[] = [];
    for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) items.push(i);
    else if (items[items.length - 1] !== "…") items.push("…");
    }

    return (
    <div className="flex items-center justify-between border-t border-sand-200 px-5 py-4">
      <span className="text-xs text-ink-800/40">{total} total</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1}
          className="w-8 h-8 rounded-xl bg-sand-100 flex items-center justify-center hover:bg-sand-200 disabled:opacity-40 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {items.map((item, i) =>
          item === "…" ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-ink-800/40 text-sm">…</span>
          ) : (
            <button key={item} onClick={() => onPage(item as number)}
              className={cls("w-8 h-8 rounded-xl text-sm font-semibold transition-colors",
                item === page ? "bg-ink-900 text-sand-50" : "bg-sand-100 text-ink-800 hover:bg-sand-200")}>
              {item}
            </button>
          )
        )}
        <button onClick={() => onPage(page + 1)} disabled={page >= pages}
          className="w-8 h-8 rounded-xl bg-sand-100 flex items-center justify-center hover:bg-sand-200 disabled:opacity-40 transition-colors">
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
    );
}
