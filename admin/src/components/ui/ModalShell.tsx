import { motion } from "framer-motion";
import { X } from "lucide-react";
import React from "react";
import { cls } from "../../utils/helpers";

export default function ModalShell({ title, onClose, wide, children }: {
      title: string; onClose: () => void; wide?: boolean; children: React.ReactNode;
    }) {
    return (
    <div className="fixed inset-0 z-50 bg-ink-900/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget && window.confirm("Discard unsaved changes?")) onClose() }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className={cls("bg-sand-50 rounded-[28px] my-8 shadow-2xl", wide ? "w-full max-w-5xl" : "w-full max-w-2xl")}
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-sand-50 rounded-t-[28px] border-b border-sand-200 px-7 py-5 flex items-center justify-between z-10">
          <h3 className="font-serif text-2xl text-ink-900">{title}</h3>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-sand-100 hover:bg-sand-200 flex items-center justify-center transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-7">{children}</div>
      </motion.div>
    </div>
    );
}
