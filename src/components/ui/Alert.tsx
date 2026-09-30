import type { ReactNode } from "react";
import { cn } from "./cn";

interface AlertProps {
  tone?: "error" | "info" | "success";
  title?: string;
  children?: ReactNode;
  className?: string;
}

const TONES = {
  error: "border-danger bg-danger-soft text-danger",
  info: "border-line bg-card text-ink",
  success: "border-brand bg-brand-soft text-brand-dark",
} as const;

export function Alert({ tone = "info", title, children, className }: AlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("border-l-4 px-4 py-3 text-sm", TONES[tone], className)}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children}
    </div>
  );
}
