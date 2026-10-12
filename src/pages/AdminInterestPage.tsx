
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    RefreshCw,
    Users,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    Tags,
} from "lucide-react";

import { apiRequest } from "@/lib/api";
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

type AuthUser = {
    id: string;
    name: string;
    email: string;
    role: "admin" | "user";
};

type InterestGroup = {
    _id: string;
    users: {
        id: string;
        name: string;
    }[];
    count: number;
};

type InterestGroupsResponse = {
    groups: InterestGroup[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

const PAGE_SIZE = 10;

function getInitials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}

export default function AdminInterestsPage() {
    const navigate = useNavigate();
    const token = localStorage.getItem("accessToken");

    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [groups, setGroups] = useState<InterestGroup[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");

    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {
            navigate("/login", { replace: true });
            return;
        }

        try {
            const parsed = JSON.parse(storedUser) as AuthUser;

            if (parsed.role !== "admin") {
                navigate("/dashboard", { replace: true });
                return;
            }

            setCurrentUser(parsed);
        } catch {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            navigate("/login", { replace: true });
        }
    }, [token, navigate]);

    const loadGroups = useCallback(async () => {
        if (!token || currentUser?.role !== "admin") return;

        setLoading(true);
        setPageError("");

        try {
            const result = await apiRequest<InterestGroupsResponse>(
                `/admin/users/by-interests?page=${page}&limit=${PAGE_SIZE}`,
                {},
                token,
            );

            setGroups(result.groups);
            setTotal(result.pagination.total);
            setTotalPages(Math.max(1, result.pagination.totalPages));
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to load interest groups.";

            setPageError(message);

            if (/unauthorized|invalid token|expired token/i.test(message)) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                navigate("/login", { replace: true });
            }
        } finally {
            setLoading(false);
        }
    }, [token, currentUser?.role, page, navigate]);

    useEffect(() => {
        void loadGroups();
    }, [loadGroups]);

    return (
        <main className="min-h-screen bg-zinc-50 text-zinc-900">
            <header className="border-b border-zinc-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
                            <ShieldCheck className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">NoteBunker</p>
                            <p className="text-xs text-zinc-500">
                                Administration
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => navigate("/admin")}
                        className="gap-2"
                    >
                        <ArrowLeft className="size-4" />
                        Back to users
                    </Button>
                </div>
            </header>

            <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-sm font-medium text-zinc-500">
                            ADMINISTRATION / INTERESTS
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                            Interest groups
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
                            Explore users grouped by their interests.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => void loadGroups()}
                        disabled={loading}
                        className="gap-2"
                    >
                        <RefreshCw
                            className={`size-4 ${loading ? "animate-spin" : ""}`}
                        />
                        Refresh
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                <Tags className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">
                                    Total interest groups
                                </p>
                                <p className="text-2xl font-semibold">
                                    {total}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                <Users className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">
                                    Groups on this page
                                </p>
                                <p className="text-2xl font-semibold">
                                    {groups.length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {pageError && (
                    <div
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        <p>{pageError}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => void loadGroups()}
                        >
                            Try again
                        </Button>
                    </div>
                )}

                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Card key={index}>
                                <CardContent className="space-y-4 p-5">
                                    <div className="h-5 w-2/5 animate-pulse rounded bg-zinc-200" />
                                    <div className="h-4 w-1/4 animate-pulse rounded bg-zinc-100" />
                                    <Separator />
                                    <div className="h-10 animate-pulse rounded bg-zinc-100" />
                                    <div className="h-10 animate-pulse rounded bg-zinc-100" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : !pageError && groups.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center py-16 text-center">
                            <div className="flex size-14 items-center justify-center rounded-full bg-zinc-100">
                                <Tags className="size-6 text-zinc-500" />
                            </div>
                            <h2 className="mt-4 text-lg font-semibold">
                                No interest groups yet
                            </h2>
                            <p className="mt-2 max-w-md text-sm text-zinc-500">
                                Assign interests to users from user management.
                                Groups will appear here automatically.
                            </p>
                        </CardContent>
                    </Card>
                ) : !pageError ? (
                    <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {groups.map((group) => (
                            <Card key={group._id} className="overflow-hidden">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <CardTitle className="break-words text-lg capitalize">
                                                {group._id}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {group.count}{" "}
                                                {group.count === 1
                                                    ? "user"
                                                    : "users"}
                                            </CardDescription>
                                        </div>
                                        <Badge variant="secondary">
                                            {group.count}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <Separator />

                                <CardContent className="space-y-3 p-4">
                                    {group.users.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3"
                                        >
                                            <Avatar className="size-9">
                                                <AvatarFallback className="text-xs">
                                                    {getInitials(user.name) || "U"}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {user.name}
                                                </p>
                                                <p className="truncate text-xs text-zinc-500">
                                                    {user.id}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : null}

                {!loading && !pageError && totalPages > 1 && (
                    <div className="flex flex-col gap-3 border-t border-zinc-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-zinc-500">
                            Page {page} of {totalPages} · {total} interest groups
                        </p>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() =>
                                    setPage((current) => Math.max(1, current - 1))
                                }
                                className="gap-1"
                            >
                                <ChevronLeft className="size-4" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() =>
                                    setPage((current) =>
                                        Math.min(totalPages, current + 1),
                                    )
                                }
                                className="gap-1"
                            >
                                Next
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}
