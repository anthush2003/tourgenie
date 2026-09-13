import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

export default function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
    return (
    <div className="fixed inset-0 z-60 bg-ink-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-sand-50 rounded-3xl p-7 max-w-sm w-full shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="font-serif text-xl text-ink-900 mb-2">Confirm Delete</h3>
        <p className="text-ink-800/60 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl bg-sand-100 text-ink-800 text-sm font-medium hover:bg-sand-200 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">Delete</button>
        </div>
      </motion.div>
    </div>
    );
}
