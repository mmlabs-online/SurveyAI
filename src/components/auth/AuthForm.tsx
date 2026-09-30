"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Logo } from "@/components/ui/Logo";
import { Mascot } from "@/components/ui/Mascot";
import { Sparkle } from "@/components/ui/Sparkle";
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
    <main className="mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-6 px-5 py-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:px-10">
      <aside className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
        <Logo />
        <div className="relative mt-6 flex w-full max-w-sm justify-center rounded-[2.5rem] border-2 border-ink bg-brand-soft px-6 pb-6 pt-8 shadow-pop lg:mt-10 lg:max-w-md lg:pb-10 lg:pt-12">
          <Sparkle className="absolute left-6 top-6 text-sun" size={26} />
          <Sparkle className="absolute right-8 top-12 text-pink [animation-delay:0.9s]" size={20} />
          <Sparkle className="absolute bottom-8 left-10 text-mint [animation-delay:1.6s]" size={18} />
          <Mascot mood={mode === "signup" ? "cheer" : "wink"} size={132} className="lg:size-[200px]" />
        </div>
        <p className="mt-6 hidden max-w-sm font-display text-2xl leading-snug font-bold text-ink lg:block">
          {vi.meta.description}
        </p>
      </aside>

      <section className="w-full max-w-md justify-self-center rounded-bubble border-2 border-ink bg-card p-6 shadow-pop animate-rise sm:p-8">
        <h1 className="font-display text-3xl leading-tight font-extrabold">{copy.title}</h1>
        <p className="mt-1 text-muted">{copy.subtitle}</p>
        <Alert tone="info" className="mt-5">
          <p className="font-semibold">{vi.auth.demoNotice}</p>
        </Alert>
        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
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
          <Button type="submit" loading={submitting} className="mt-2 w-full">
            {submitting ? vi.common.processing : copy.submit}
          </Button>
        </form>
        <p className="mt-5 text-center text-muted">
          {copy.switchPrompt}{" "}
          <Link
            href={`${otherHref}${otherQuery}`}
            className="rounded-md font-bold text-brand-ink underline decoration-2 underline-offset-4 hover:bg-brand-soft"
          >
            {copy.switchAction}
          </Link>
        </p>
      </section>
    </main>
  );
}
