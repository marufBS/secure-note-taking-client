import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { apiRequest } from "../lib/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RegisterResponse = {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "user" | "admin";
  };
};

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiRequest<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      navigate("/login", {
        replace: true,
        state: { message: "Registration successful. Please sign in." },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <LockKeyhole className="size-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Secure Notes
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a private space for your thoughts.
          </p>
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>
              Fill in your details to get started.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Use the password requirements enforced by the server.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Sign in
          </Link>
        </p>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4" />
          Your account is protected by secure authentication.
        </div>
      </div>
    </main>
  );
}