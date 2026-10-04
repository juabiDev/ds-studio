"use client";

import { useState, type FormEvent } from "react";

import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

import { Button } from "@ds-studio/ui/button";
import { Input } from "@ds-studio/ui/input";
import { Label } from "@ds-studio/ui/label";
import { cn } from "@ds-studio/ui/utils";

import { signIn } from "@/app/actions/auth";

const labelClass = "font-condensed text-xs uppercase tracking-[0.2em] text-muted-foreground";
const iconClass = "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground";
const inputClass = "h-12 border-border bg-input-background/80 pl-11 text-base backdrop-blur md:text-base";

export const LoginForm = () => {
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setError(undefined);

    // On success the action redirects, so a result here always means failure
    const result = await signIn(new FormData(event.currentTarget));
    if (result) setError(result.error);
    setIsPending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className={labelClass}>
          Email
        </Label>
        <div className="relative">
          <Mail size={18} className={iconClass} />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="admin@dsstudio.com"
            required
            aria-invalid={!!error}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className={labelClass}>
          Contraseña
        </Label>
        <div className="relative">
          <Lock size={18} className={iconClass} />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            aria-invalid={!!error}
            className={cn(inputClass, "pr-12")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-3 text-sm text-foreground"
        >
          <AlertCircle size={18} className="mt-px shrink-0 text-destructive" />
          <p>{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="group mt-2 h-12 font-condensed text-sm font-semibold uppercase tracking-[0.25em]"
      >
        {isPending ? (
          <>
            <Loader2 className="animate-spin" />
            Ingresando…
          </>
        ) : (
          <>
            Ingresar
            <ArrowRight className="transition-transform group-hover:translate-x-1" />
          </>
        )}
      </Button>
    </form>
  );
};
