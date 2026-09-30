export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}
