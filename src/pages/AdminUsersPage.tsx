import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Pencil,
    Plus,
    ShieldCheck,
    Trash2,
    Users,
    X,
} from "lucide-react";

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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type UserRole = "user" | "admin";

type AdminUser = {
    _id?: string;
    id?: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: string;
};

type Pagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

type UsersResponse = {
    users: AdminUser[];
    pagination: Pagination;
};

type UserResponse = {
    user: AdminUser;
};

type UserForm = {
    name: string;
    email: string;
    password: string;
    role: UserRole;
};

const PAGE_SIZE = 10;

const EMPTY_FORM: UserForm = {
    name: "",
    email: "",
    password: "",
    role: "user",
};

function getUserId(user: AdminUser) {
    return user._id ?? user.id ?? "";
}

function getInitials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export default function AdminUsersPage() {
    const navigate = useNavigate();
    const token = localStorage.getItem("accessToken");

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 0,
    });

    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [form, setForm] = useState<UserForm>(EMPTY_FORM);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadUsers = useCallback(async () => {
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await apiRequest<UsersResponse>(
                `/admin/users?page=${page}&limit=${PAGE_SIZE}`,
                {},
                token,
            );

            setUsers(result.users);
            setPagination(result.pagination);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to load users";

            setError(message);

            if (
                /authentication required|unauthorized|invalid token|expired token|invalid or expired session/i.test(
                    message,
                )
            ) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                navigate("/login", { replace: true });
            } else if (/forbidden/i.test(message)) {
                navigate("/dashboard", { replace: true });
            }
        } finally {
            setLoading(false);
        }
    }, [navigate, page, token]);

    useEffect(() => {
        void loadUsers();
    }, [loadUsers]);

    function openCreateDialog() {
        setEditingUser(null);
        setForm(EMPTY_FORM);
        setError("");
        setSuccess("");
        setDialogOpen(true);
    }

    function openEditDialog(user: AdminUser) {
        setEditingUser(user);
        setForm({
            name: user.name,
            email: user.email,
            password: "",
            role: user.role,
        });
        setError("");
        setSuccess("");
        setDialogOpen(true);
    }

    function updateField<K extends keyof UserForm>(
        field: K,
        value: UserForm[K],
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        const payload: {
            name: string;
            email: string;
            role: UserRole;
            password?: string;
        } = {
            name: form.name.trim(),
            email: form.email.trim(),
            role: form.role,
        };

        if (form.password) {
            payload.password = form.password;
        }

        try {
            if (editingUser) {
                const id = getUserId(editingUser);

                await apiRequest<UserResponse>(
                    `/admin/users/${id}`,
                    {
                        method: "PATCH",
                        body: JSON.stringify(payload),
                    },
                    token,
                );

                setSuccess("User updated successfully.");
            } else {
                if (!form.password) {
                    setError("A password is required when creating a user.");
                    return;
                }

                await apiRequest<UserResponse>(
                    "/admin/users",
                    {
                        method: "POST",
                        body: JSON.stringify(payload),
                    },
                    token,
                );

                setSuccess("User created successfully.");
                setPage(1);
            }

            setDialogOpen(false);
            setForm(EMPTY_FORM);
            setEditingUser(null);

            if (page === 1 || editingUser) {
                await loadUsers();
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to save user",
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(user: AdminUser) {
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        const id = getUserId(user);

        if (!id) {
            setError("Could not identify this user.");
            return;
        }

        if (
            !window.confirm(
                `Delete the account for ${user.name} (${user.email})? This action cannot be undone.`,
            )
        ) {
            return;
        }

        setError("");
        setSuccess("");
        setDeletingId(id);

        try {
            await apiRequest<void>(
                `/admin/users/${id}`,
                { method: "DELETE" },
                token,
            );

            setSuccess("User deleted successfully.");

            if (users.length === 1 && page > 1) {
                setPage((current) => current - 1);
            } else {
                await loadUsers();
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to delete user",
            );
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <main className="min-h-screen bg-zinc-50 text-zinc-900">
            <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur-md">
                <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
                            <ShieldCheck className="size-5" />
                        </div>

                        <div className="min-w-0">
                            <h1 className="truncate font-semibold tracking-tight">
                                NoteBunker
                            </h1>
                            <p className="text-xs text-zinc-500">
                                Administration
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => navigate("/dashboard")}
                    >
                        <ArrowLeft className="size-4" />
                        <span className="hidden sm:inline">
                            Back to dashboard
                        </span>
                        <span className="sm:hidden">Back</span>
                    </Button>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
                <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                            ADMINISTRATION
                        </p>
                        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                            User management
                        </h2>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
                            Manage accounts, update permissions, and control
                            access to your workspace.
                        </p>
                    </div>

                    <Button onClick={openCreateDialog} className="gap-2">
                        <Plus className="size-4" />
                        Create user
                    </Button>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={() => setError("")}
                            aria-label="Dismiss error"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                )}

                {success && (
                    <div
                        role="status"
                        className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                    >
                        <p>{success}</p>
                        <button
                            type="button"
                            onClick={() => setSuccess("")}
                            aria-label="Dismiss message"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                )}

                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                    <Card className="gap-3 border-zinc-200 shadow-none">
                        <CardContent className="flex items-center gap-4">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-100">
                                <Users className="size-5 text-zinc-700" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">
                                    Total accounts
                                </p>
                                <p className="text-2xl font-semibold">
                                    {pagination.total}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-3 border-zinc-200 shadow-none">
                        <CardContent className="flex items-center gap-4">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-violet-50">
                                <ShieldCheck className="size-5 text-violet-700" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">
                                    Admins on this page
                                </p>
                                <p className="text-2xl font-semibold">
                                    {users.filter((user) => user.role === "admin").length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="gap-0 overflow-hidden border-zinc-200 bg-white py-0 shadow-sm">
                    <CardHeader className="gap-1 px-5 py-5 sm:px-6">
                        <CardTitle className="text-lg">
                            All accounts
                        </CardTitle>
                        <CardDescription>
                            Browse and manage registered users.
                        </CardDescription>
                    </CardHeader>

                    <Separator />

                    <CardContent className="p-0">
                        {loading ? (
                            <div className="space-y-5 p-5 sm:p-6">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-4"
                                    >
                                        <Skeleton className="size-10 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-1/3" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                        <Skeleton className="h-8 w-20" />
                                    </div>
                                ))}
                            </div>
                        ) : users.length === 0 ? (
                            <div className="flex flex-col items-center px-6 py-16 text-center">
                                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-zinc-100">
                                    <Users className="size-6 text-zinc-500" />
                                </div>
                                <h3 className="font-semibold">No users found</h3>
                                <p className="mt-2 text-sm text-zinc-500">
                                    Create an account to get started.
                                </p>
                                <Button
                                    onClick={openCreateDialog}
                                    className="mt-5 gap-2"
                                >
                                    <Plus className="size-4" />
                                    Create user
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-y border-zinc-100 bg-zinc-50/80 text-xs font-medium uppercase tracking-wide text-zinc-500">
                                        <tr>
                                            <th className="px-5 py-3 sm:px-6">
                                                User
                                            </th>
                                            <th className="px-5 py-3">
                                                Role
                                            </th>
                                            <th className="px-5 py-3">
                                                Joined
                                            </th>
                                            <th className="px-5 py-3 text-right sm:px-6">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-zinc-100">
                                        {users.map((user) => {
                                            const id = getUserId(user);

                                            return (
                                                <tr
                                                    key={id}
                                                    className="transition-colors hover:bg-zinc-50/70"
                                                >
                                                    <td className="px-5 py-4 sm:px-6">
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <Avatar className="size-10 shrink-0">
                                                                <AvatarFallback className="bg-zinc-100 text-xs font-semibold text-zinc-700">
                                                                    {getInitials(user.name)}
                                                                </AvatarFallback>
                                                            </Avatar>

                                                            <div className="min-w-0">
                                                                <p className="truncate font-medium text-zinc-900">
                                                                    {user.name}
                                                                </p>
                                                                <p className="max-w-[240px] truncate text-xs text-zinc-500 sm:max-w-none">
                                                                    {user.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <Badge
                                                            variant={
                                                                user.role === "admin"
                                                                    ? "default"
                                                                    : "secondary"
                                                            }
                                                            className="capitalize"
                                                        >
                                                            {user.role}
                                                        </Badge>
                                                    </td>

                                                    <td className="whitespace-nowrap px-5 py-4 text-zinc-500">
                                                        {formatDate(user.createdAt)}
                                                    </td>

                                                    <td className="px-5 py-4 sm:px-6">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="size-9"
                                                                aria-label={`Edit ${user.name}`}
                                                                title="Edit user"
                                                                onClick={() => openEditDialog(user)}
                                                            >
                                                                <Pencil className="size-4" />
                                                            </Button>

                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="size-9 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                                aria-label={`Delete ${user.name}`}
                                                                title="Delete user"
                                                                disabled={deletingId === id}
                                                                onClick={() => void handleDelete(user)}
                                                            >
                                                                {deletingId === id ? (
                                                                    <Loader2 className="size-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="size-4" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>

                    <Separator />

                    <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <p className="text-sm text-zinc-500">
                            {pagination.total === 0
                                ? "No accounts"
                                : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, pagination.total)} of ${pagination.total} accounts`}
                        </p>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                disabled={loading || page <= 1}
                                onClick={() => setPage((current) => current - 1)}
                            >
                                <ChevronLeft className="size-4" />
                                Previous
                            </Button>

                            <span className="min-w-20 text-center text-sm text-zinc-500">
                                Page {page} of {Math.max(1, pagination.totalPages)}
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                disabled={
                                    loading ||
                                    page >= pagination.totalPages ||
                                    pagination.totalPages === 0
                                }
                                onClick={() => setPage((current) => current + 1)}
                            >
                                Next
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </Card>

                <footer className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-zinc-200 pt-5 text-xs text-zinc-400 sm:flex-row">
                    <p>NoteBunker · Administration</p>
                    <p className="flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5" />
                        Admin access required
                    </p>
                </footer>
            </div>

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    if (!saving) {
                        setDialogOpen(open);

                        if (!open) {
                            setEditingUser(null);
                            setForm(EMPTY_FORM);
                        }
                    }
                }}
            >
                <DialogContent className="gap-0 p-0 sm:max-w-lg">
                    <DialogHeader className="border-b border-zinc-100 px-6 py-5 text-left">
                        <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-zinc-100">
                            {editingUser ? (
                                <Pencil className="size-5" />
                            ) : (
                                <Plus className="size-5" />
                            )}
                        </div>

                        <DialogTitle className="text-xl">
                            {editingUser ? "Edit user" : "Create user"}
                        </DialogTitle>

                        <DialogDescription className="leading-5">
                            {editingUser
                                ? "Update account details and permissions. Leave the password empty to keep the current password."
                                : "Create a new account and choose its access role."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-5 px-6 py-5">
                            <div className="space-y-2">
                                <Label htmlFor="user-name">Full name</Label>
                                <Input
                                    id="user-name"
                                    value={form.name}
                                    onChange={(e) =>
                                        updateField("name", e.target.value)
                                    }
                                    placeholder="Enter full name"
                                    minLength={2}
                                    maxLength={100}
                                    autoComplete="name"
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="user-email">Email address</Label>
                                <Input
                                    id="user-email"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) =>
                                        updateField("email", e.target.value)
                                    }
                                    placeholder="name@example.com"
                                    maxLength={254}
                                    autoComplete="email"
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="user-password">
                                    Password {editingUser && "(optional)"}
                                </Label>
                                <Input
                                    id="user-password"
                                    type="password"
                                    value={form.password}
                                    onChange={(e) =>
                                        updateField("password", e.target.value)
                                    }
                                    placeholder={
                                        editingUser
                                            ? "Leave blank to keep current password"
                                            : "At least 8 characters"
                                    }
                                    minLength={8}
                                    maxLength={72}
                                    autoComplete="new-password"
                                    required={!editingUser}
                                    disabled={saving}
                                />
                                <p className="text-xs leading-5 text-zinc-500">
                                    {editingUser
                                        ? "Enter a new password only if you want to change it."
                                        : "Use at least 8 characters."}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="user-role">Account role</Label>
                                <select
                                    id="user-role"
                                    value={form.role}
                                    onChange={(e) =>
                                        updateField(
                                            "role",
                                            e.target.value as UserRole,
                                        )
                                    }
                                    disabled={saving}
                                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <p className="text-xs leading-5 text-zinc-500">
                                    Admins can manage accounts and view all notes.
                                </p>
                            </div>

                            {error && (
                                <p
                                    role="alert"
                                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                                >
                                    {error}
                                </p>
                            )}
                        </div>

                        <DialogFooter className="border-t border-zinc-100 bg-zinc-50/70 px-6 py-4 sm:justify-between">
                            <Button
                                type="button"
                                variant="ghost"
                                disabled={saving}
                                onClick={() => {
                                    setDialogOpen(false);
                                    setEditingUser(null);
                                    setForm(EMPTY_FORM);
                                }}
                            >
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                disabled={saving}
                                className="min-w-32 gap-2"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        {editingUser ? (
                                            <Pencil className="size-4" />
                                        ) : (
                                            <Plus className="size-4" />
                                        )}
                                        {editingUser ? "Save changes" : "Create user"}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </main>
    );
}