export function StatusBadge({
  tone,
  children,
}: {
  tone: "success" | "warn" | "muted" | "danger";
  children: React.ReactNode;
}) {
  const map = {
    success: "ru-badge-success",
    warn: "ru-badge-warn",
    muted: "ru-badge-muted",
    danger: "ru-badge-danger",
  } as const;
  return <span className={`ru-badge ${map[tone]}`}>{children}</span>;
}

export function statusToneFromJob(
  status: string,
): "success" | "warn" | "muted" | "danger" {
  if (status === "completed") return "success";
  if (status === "cancelled") return "danger";
  if (
    status === "in_progress" ||
    status === "confirmed" ||
    status === "assigned" ||
    status === "searching_driver" ||
    status === "new"
  ) {
    return "warn";
  }
  return "muted";
}
