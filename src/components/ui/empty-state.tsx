import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  compact,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "px-4 py-8 text-center" : "px-4 pt-16 text-center"}>
      <Icon
        className="mx-auto h-12 w-12 text-[#666666]"
        strokeWidth={1.5}
        aria-hidden
      />
      <p className="mt-4 text-[16px] font-bold text-[#111111]">{title}</p>
      <p className="mt-2 text-[14px] leading-relaxed text-[#666666]">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
