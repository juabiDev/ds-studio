"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@ds-studio/ui/button";
import { Input } from "@ds-studio/ui/input";
import { Label } from "@ds-studio/ui/label";

import { signIn } from "@/app/actions/auth";

export const LoginForm = () => {
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required className="h-11" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-11" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending} className="h-11">
        {isPending ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
};
