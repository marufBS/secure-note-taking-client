
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";

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

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await apiRequest<LoginResponse>(
                "/auth/login",
                {
                    method: "POST",
                    body: JSON.stringify({ email, password }),
                }
            );

            localStorage.setItem("accessToken", result.accessToken);
            localStorage.setItem("user", JSON.stringify(result.user));

            navigate("/dashboard");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Login failed"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main>
            <h1>Sign in</h1>
            <p>Sign in to manage your secure notes.</p>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && <p role="alert">{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Signing in..." : "Sign in"}
                </button>
            </form>

            <p>
                Don't have an account? <Link to="/register">Register</Link>
            </p>
        </main>
    );
}
