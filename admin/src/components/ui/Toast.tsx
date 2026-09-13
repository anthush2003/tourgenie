import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import { cls } from "../../utils/helpers";

export default function Toast({ message, type }: { message: string; type: "success" | "error" }) {
    return (
    <motion.div initial={{ opacity: 0, y: 24, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24 }}
      className={cls("fixed bottom-6 right-6 z-70 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-sm font-medium max-w-sm",
        type === "success" ? "bg-leaf-700 text-sand-50" : "bg-red-600 text-white")}>
      {type === "success" ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
      {message}
    </motion.div>
    );
}
