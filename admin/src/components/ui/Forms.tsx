import { X } from "lucide-react";
import { useState } from "react";
import { cls } from "../../utils/helpers";

export function Inp({ label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
    <div>
      {label && <label className="text-xs uppercase tracking-widest text-ink-800/50 font-semibold block mb-1.5">{label}</label>}
      <input {...props} className={cls(
        "w-full px-4 py-3 rounded-2xl bg-sand-100 border border-sand-200 focus:border-leaf-600 focus:outline-none focus:ring-2 focus:ring-leaf-600/15 transition-all text-sm",
        props.className as string)} />
    </div>
    );
}

export function Txa({ label, maxLength, value, ...props }: { label?: string; maxLength?: number } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    const len = typeof value === "string" ? value.length : 0;
    return (
    <div>
      {label && <label className="text-xs uppercase tracking-widest text-ink-800/50 font-semibold block mb-1.5">{label}</label>}
      <textarea maxLength={maxLength} value={value} {...props} className={cls(
        "w-full px-4 py-3 rounded-2xl bg-sand-100 border border-sand-200 focus:border-leaf-600 focus:outline-none focus:ring-2 focus:ring-leaf-600/15 transition-all text-sm min-h-22.5 resize-y",
        props.className as string)} />
      {maxLength && <div className="text-right text-xs text-ink-800/50 mt-1">{len} / {maxLength}</div>}
    </div>
    );
}

export function Sel({ label, children, ...props }: { label?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
    <div>
      {label && <label className="text-xs uppercase tracking-widest text-ink-800/50 font-semibold block mb-1.5">{label}</label>}
      <select {...props} className="w-full px-4 py-3 rounded-2xl bg-sand-100 border border-sand-200 focus:border-leaf-600 focus:outline-none text-sm appearance-none cursor-pointer">
        {children}
      </select>
    </div>
    );
}

export function TagInput({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
    const [input, setInput] = useState("");
    const add = () => {
            const t = input.trim();
            if (t && !value.includes(t)) { onChange([...value, t]); setInput(""); }
          };
    return (
    <div>
      <label className="text-xs uppercase tracking-widest text-ink-800/50 font-semibold block mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2 min-h-22.5">
        {value.map(t => (
          <span key={t} className="flex items-center gap-1 px-3 py-1 rounded-full bg-leaf-700/10 text-leaf-700 text-xs font-medium border border-leaf-700/20">
            {t}
            <button type="button" onClick={() => onChange(value.filter(x => x !== t))} className="hover:text-red-600 transition-colors"><X className="w-3 h-3" /></button>
          </span>
        ))}
        {value.length === 0 && <span className="text-xs text-ink-800/30 italic">None added yet</span>}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Type and press Enter or Add"
          className="flex-1 px-4 py-2.5 rounded-2xl bg-sand-100 border border-sand-200 text-sm focus:outline-none focus:border-leaf-600" />
        <button type="button" onClick={add}
          className="px-4 py-2.5 rounded-2xl bg-leaf-700 text-sand-50 text-sm hover:bg-leaf-600 transition-colors font-medium">Add</button>
      </div>
    </div>
    );
}

export default function ManualUrlInput({ label, onAdd }: { label: string; onAdd: (u: string) => void }) {
    const [val, setVal] = useState("");
    const add = () => { if (val.trim()) { onAdd(val.trim()); setVal(""); } };
    return (
    <div className="flex gap-2">
      <input value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        placeholder={label}
        className="flex-1 px-3 py-2 rounded-xl bg-sand-100 border border-sand-200 text-xs focus:outline-none focus:border-leaf-600" />
      <button type="button" onClick={add}
        className="px-3 py-2 rounded-xl bg-sand-200 text-ink-800 text-xs hover:bg-sand-300 transition-colors font-medium">Add</button>
    </div>
    );
}
