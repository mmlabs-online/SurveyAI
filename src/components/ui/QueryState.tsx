import { vi } from "@/i18n/vi";
import { Alert } from "./Alert";
import { Button, Spinner } from "./Button";
import { Mascot } from "./Mascot";

export function LoadingState({ label = vi.common.loading }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12">
      <Mascot mood="thinking" size={104} />
      <p role="status" className="flex items-center gap-2 font-display text-lg font-bold text-muted">
        {label}
        <Spinner className="text-brand" />
      </p>
    </div>
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
    <div className="flex flex-col items-center gap-4 py-6">
      <Mascot mood="sad" size={96} />
      <Alert tone="error" className="w-full">
        {message}
      </Alert>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          {vi.common.retry}
        </Button>
      ) : null}
    </div>
  );
}
