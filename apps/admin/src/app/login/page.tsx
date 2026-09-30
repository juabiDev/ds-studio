import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@ds-studio/ui/card";

import { LoginForm } from "@/components/features/auth/LoginForm";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>DS STUDIO — Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
