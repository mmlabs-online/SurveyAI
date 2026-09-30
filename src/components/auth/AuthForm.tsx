"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { vi } from "@/i18n/vi";
import { getApiClient, isApiError } from "@/lib/api";
import { safeNextPath } from "@/lib/navigation";

type Mode = "login" | "signup";

interface FormErrors {
  email?: string;
  password?: string;
  form?: string;
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const nextParam = useSearchParams().get("next");
  const copy = vi.auth[mode];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const api = getApiClient();
      await (mode === "signup"
        ? api.signup({ email, password })
        : api.login({ email, password }));
      router.replace(safeNextPath(nextParam));
    } catch (error) {
      if (isApiError(error) && error.details.field) {
        setErrors({ [error.details.field]: error.message });
      } else {
        setErrors({ form: isApiError(error) ? error.message : vi.errors.unknown });
      }
      setSubmitting(false);
    }
  }

  const otherHref = mode === "login" ? "/signup" : "/login";
  const otherQuery = nextParam ? `?next=${encodeURIComponent(nextParam)}` : "";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <div>
        <p className="font-serif text-sm font-semibold uppercase tracking-widest text-accent">
          {vi.brand}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold">{copy.title}</h1>
        <p className="mt-2 text-muted">{copy.subtitle}</p>
      </div>
      <Alert tone="info">
        <p className="font-semibold">{vi.auth.demoNotice}</p>
      </Alert>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {errors.form ? <Alert tone="error">{errors.form}</Alert> : null}
        <TextField
          label={vi.auth.emailLabel}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
        <TextField
          label={vi.auth.passwordLabel}
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={mode === "signup" ? vi.auth.passwordHint : undefined}
          error={errors.password}
          required
        />
        <Button type="submit" loading={submitting} className="w-full">
          {submitting ? vi.common.processing : copy.submit}
        </Button>
      </form>
      <p className="text-sm text-muted">
        {copy.switchPrompt}{" "}
        <Link
          href={`${otherHref}${otherQuery}`}
          className="font-semibold text-brand-dark underline underline-offset-4"
        >
          {copy.switchAction}
        </Link>
      </p>
    </main>
  );
}
