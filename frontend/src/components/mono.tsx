import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Mono({ children, className, dim }: { children: ReactNode; className?: string; dim?: boolean }) {
  return (
    <span
      className={cn("font-mono", dim && "text-text-tertiary", className)}
      style={{ fontSize: "11px", letterSpacing: "0.05em", textTransform: "uppercase" }}
    >
      {children}
    </span>
  );
}
