import React from "react";
import { cls } from "../../utils/helpers";

export default function Card({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cls("bg-sand-50 border border-sand-200 rounded-3xl", className)}>{children}</div>;
}
