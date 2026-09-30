import { vi } from "@/i18n/vi";
import { Alert } from "./Alert";
import { Button } from "./Button";

export function LoadingState({ label = vi.common.loading }: { label?: string }) {
  return (
    <p role="status" className="py-10 text-center text-muted">
      {label}
    </p>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="space-y-3 py-6">
      <Alert tone="error">{message}</Alert>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          {vi.common.retry}
        </Button>
      ) : null}
    </div>
  );
}
