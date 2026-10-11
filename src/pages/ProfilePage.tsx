import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, UserRound } from "lucide-react";

import { apiRequest } from "../lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type UserProfile = {
    id: string;
    name: string;
    email: string;
    role: "user" | "admin";
    interest: string[];
    createdAt: string;
};

type ProfileResponse = {
    user: UserProfile;
};

export default function ProfilePage() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        async function loadProfile() {
            try {
                const result = await apiRequest<ProfileResponse>(
                    "/users/me",
                    {},
                    token as string,
                );

                setProfile(result.user);
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "Failed to load profile";

                setError(message);

                if (/authentication|required|invalid|expired/i.test(message)) {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("user");
                    navigate("/login", { replace: true });
                }
            } finally {
                setLoading(false);
            }
        }

        void loadProfile();
    }, [navigate]);

    const initials = profile?.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");

    return (
        <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 sm:px-8">
            <div className="mx-auto max-w-2xl">
                <Button
                    variant="ghost"
                    className="mb-6 gap-2"
                    onClick={() => navigate("/dashboard")}
                >
                    <ArrowLeft className="size-4" />
                    Back to dashboard
                </Button>

                <div className="mb-8">
                    <p className="mb-2 text-sm font-medium text-zinc-500">
                        ACCOUNT SETTINGS
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Your profile
                    </h1>
                    <p className="mt-2 text-sm text-zinc-500">
                        View your account information.
                    </p>
                </div>

                {loading ? (
                    <Card>
                        <CardHeader>
                            <Skeleton className="size-16 rounded-full" />
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-56" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </CardContent>
                    </Card>
                ) : error ? (
                    <Card>
                        <CardContent className="py-8">
                            <p role="alert" className="text-sm text-red-600">
                                {error}
                            </p>
                            <Button
                                className="mt-4"
                                variant="outline"
                                onClick={() => window.location.reload()}
                            >
                                Try again
                            </Button>
                        </CardContent>
                    </Card>
                ) : profile ? (
                    <Card className="gap-0 overflow-hidden border-zinc-200 shadow-sm">
                        <CardHeader className="gap-4 px-6 py-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="size-16">
                                    <AvatarFallback className="bg-zinc-900 text-lg text-white">
                                        {initials || <UserRound />}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="min-w-0 flex-1">
                                    <CardTitle className="text-xl">
                                        {profile.name}
                                    </CardTitle>
                                    <CardDescription className="mt-1 break-all">
                                        {profile.email}
                                    </CardDescription>
                                    <Badge variant="secondary" className="mt-2">
                                        {profile.role}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>

                        <Separator />

                        <CardContent className="space-y-5 px-6 py-6">
                            <div>
                                <p className="text-sm text-zinc-500">
                                    Full name
                                </p>
                                <p className="mt-1 font-medium">
                                    {profile.name}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-zinc-500">
                                    Email address
                                </p>
                                <p className="mt-1 break-all font-medium">
                                    {profile.email}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-zinc-500">
                                    Account role
                                </p>
                                <p className="mt-1 flex items-center gap-2 font-medium capitalize">
                                    <ShieldCheck className="size-4 text-zinc-500" />
                                    {profile.role}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-zinc-500">
                                    Member since
                                </p>
                                <p className="mt-1 font-medium">
                                    {new Date(profile.createdAt).toLocaleDateString(
                                        undefined,
                                        {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        },
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-zinc-500">
                                    Interests
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {profile.interest?.length ? (
                                        profile.interest.map((interest) => (
                                            <Badge
                                                key={interest}
                                                variant="outline"
                                            >
                                                {interest}
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-sm text-zinc-400">
                                            No interests added yet.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}
            </div>
        </main>
    );
}