import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { apiRequest } from "../lib/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

type LoginResponse = {
  accessToken: string;
  tokenType: string;
  user: AuthUser;
};

type LocationState = {
  message?: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("accessToken", result.accessToken);
      localStorage.setItem("user", JSON.stringify(result.user));

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
            Your private thoughts, safely organized.
          </p>
        </div>
        <div className="mb-8 text-center">
          
          <h3 className="text-xl font-semibold tracking-tight">
            Admin Credentials:
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            email: admin@example.com
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            pass: admin123
          </p>
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your notes.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {state?.message && (
              <div
                role="status"
                className="mb-5 rounded-lg border border-border bg-muted/50 p-3 text-sm"
              >
                {state.message}
              </div>
            )}

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
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Create an account
          </Link>
        </p>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4" />
          Your notes are protected by secure authentication.
        </div>
      </div>
    </main>
  );
}
