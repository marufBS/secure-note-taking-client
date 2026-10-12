
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    Plus,
    Pencil,
    Trash2,
    Users,
    ShieldCheck,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
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

type Role = "admin" | "user";

type AdminUser = {
    _id: string;
    id?: string;
    name: string;
    email: string;
    role: Role;
    createdAt?: string;
};

type AuthUser = {
    id: string;
    name: string;
    email: string;
    role: Role;
};

type UserForm = {
    name: string;
    email: string;
    password: string;
    role: Role;
};

type UsersResponse = {
    users: AdminUser[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

const EMPTY_FORM: UserForm = {
    name: "",
    email: "",
    password: "",
    role: "user",
};

const PAGE_SIZE = 10;

export default function AdminPage() {
    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [pageError, setPageError] = useState("");
    const [formError, setFormError] = useState("");
    const [notice, setNotice] = useState("");

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [form, setForm] = useState<UserForm>(EMPTY_FORM);

    const token = localStorage.getItem("accessToken");

    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {
            navigate("/login", { replace: true });
            return;
        }

        try {
            const parsed = JSON.parse(storedUser) as AuthUser;
            setCurrentUser(parsed);

            if (parsed.role !== "admin") {
                navigate("/dashboard", { replace: true });
            }
        } catch {
            navigate("/login", { replace: true });
        }
    }, [navigate, token]);

    const loadUsers = useCallback(async () => {
        if (!token || currentUser?.role !== "admin") return;

        setLoading(true);
        setPageError("");

        try {
            const result = await apiRequest<UsersResponse>(
                `/admin/users?page=${page}&limit=${PAGE_SIZE}`,
                {},
                token,
            );

            setUsers(result.users);
            setTotal(result.pagination.total);
            setTotalPages(Math.max(1, result.pagination.totalPages));
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Failed to load users.";

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
        void loadUsers();
    }, [loadUsers]);

    const filteredUsers = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return users;

        return users.filter(
            (user) =>
                user.name.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term) ||
                user.role.toLowerCase().includes(term),
        );
    }, [users, search]);

    function openCreateDialog() {
        setEditingUser(null);
        setForm(EMPTY_FORM);
        setFormError("");
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
        setFormError("");
        setDialogOpen(true);
    }

    function closeDialog() {
        if (submitting) return;
        setDialogOpen(false);
        setEditingUser(null);
        setForm(EMPTY_FORM);
        setFormError("");
    }

    function updateForm<K extends keyof UserForm>(
        field: K,
        value: UserForm[K],
    ) {
        setForm((previous) => ({ ...previous, [field]: value }));
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError("");
        setNotice("");

        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        if (!form.name.trim() || !form.email.trim()) {
            setFormError("Name and email are required.");
            return;
        }

        if (!editingUser && form.password.length < 8) {
            setFormError("Password must be at least 8 characters.");
            return;
        }

        if (editingUser && form.password && form.password.length < 8) {
            setFormError("A new password must be at least 8 characters.");
            return;
        }

        const payload: Partial<UserForm> = {
            name: form.name.trim(),
            email: form.email.trim(),
            role: form.role,
        };

        if (form.password) {
            payload.password = form.password;
        }

        setSubmitting(true);

        try {
            if (editingUser) {
                await apiRequest(
                    `/admin/users/${editingUser._id}`,
                    {
                        method: "PATCH",
                        body: JSON.stringify(payload),
                    },
                    token,
                );

                setNotice("User updated successfully.");
            } else {
                await apiRequest(
                    "/admin/users",
                    {
                        method: "POST",
                        body: JSON.stringify(payload),
                    },
                    token,
                );

                setNotice("User created successfully.");
                setPage(1);
            }

            setDialogOpen(false);
            setEditingUser(null);
            setForm(EMPTY_FORM);

            if (editingUser && page !== 1) {
                await loadUsers();
            } else {
                // Refresh the first page after creating a user.
                if (!editingUser) {
                    const result = await apiRequest<UsersResponse>(
                        `/admin/users?page=1&limit=${PAGE_SIZE}`,
                        {},
                        token,
                    );
                    setUsers(result.users);
                    setTotal(result.pagination.total);
                    setTotalPages(Math.max(1, result.pagination.totalPages));
                } else {
                    await loadUsers();
                }
            }
        } catch (error) {
            setFormError(
                error instanceof Error ? error.message : "Could not save the user.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(user: AdminUser) {
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        if (user._id === currentUser?.id || user.id === currentUser?.id) {
            setPageError("You cannot delete your own admin account.");
            return;
        }

        const confirmed = window.confirm(
            `Delete ${user.name} (${user.email})? This action cannot be undone.`,
        );

        if (!confirmed) return;

        setPageError("");
        setNotice("");

        try {
            await apiRequest(
                `/admin/users/${user._id}`,
                { method: "DELETE" },
                token,
            );

            setNotice(`${user.name} was deleted.`);

            if (users.length === 1 && page > 1) {
                setPage((previous) => previous - 1);
            } else {
                await loadUsers();
            }
        } catch (error) {
            setPageError(
                error instanceof Error ? error.message : "Could not delete the user.",
            );
        }
    }

    const formatDate = (value?: string) => {
        if (!value) return "—";

        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? "—"
            : date.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
    };

    const getInitials = (name: string) =>
        name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? "")
            .join("");

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
                            <p className="text-xs text-zinc-500">Administration</p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => navigate("/dashboard")}
                        className="gap-2"
                    >
                        <ArrowLeft className="size-4" />
                        Back to notes
                    </Button>
                </div>
            </header>

            <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-sm font-medium text-zinc-500">
                            ADMINISTRATION / USERS
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                            User management
                        </h1>
                        <p className="mt-2 text-sm text-zinc-600">
                            Manage accounts, permissions, and access to NoteBunker.
                        </p>
                    </div>

                    <Button onClick={openCreateDialog} className="gap-2">
                        <Plus className="size-4" />
                        Create user
                    </Button>
                </div>

                {notice && (
                    <div
                        role="status"
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                    >
                        {notice}
                    </div>
                )}

                {pageError && (
                    <div
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        {pageError}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <Card className="border-zinc-200 shadow-sm">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-100">
                                <Users className="size-5 text-zinc-700" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">Total registered users</p>
                                <p className="mt-1 text-2xl font-semibold">
                                    {loading ? "…" : total.toLocaleString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-zinc-200 shadow-sm">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-100">
                                <ShieldCheck className="size-5 text-zinc-700" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">Accounts on this page</p>
                                <p className="mt-1 text-2xl font-semibold">
                                    {loading ? "…" : users.length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="overflow-hidden border-zinc-200 shadow-sm">
                    <CardHeader className="gap-4">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div>
                                <CardTitle>All users</CardTitle>
                                <CardDescription className="mt-1">
                                    View accounts and change their assigned role.
                                </CardDescription>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={loading}
                                onClick={() => void loadUsers()}
                                className="gap-2 self-start sm:self-auto"
                            >
                                <RefreshCw
                                    className={`size-4 ${loading ? "animate-spin" : ""}`}
                                />
                                Refresh
                            </Button>
                        </div>

                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search loaded users by name, email, or role..."
                                className="pl-9"
                            />
                        </div>
                    </CardHeader>

                    <Separator />

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">User</th>
                                        <th className="px-6 py-4 font-medium">Role</th>
                                        <th className="px-6 py-4 font-medium">Joined</th>
                                        <th className="px-6 py-4 text-right font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-zinc-100">
                                    {loading ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-6 py-12 text-center text-zinc-500"
                                            >
                                                Loading users…
                                            </td>
                                        </tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-6 py-12 text-center text-zinc-500"
                                            >
                                                {search
                                                    ? "No users match your search on this page."
                                                    : "No users found."}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => {
                                            const isCurrentUser =
                                                user._id === currentUser?.id ||
                                                user.id === currentUser?.id;

                                            return (
                                                <tr
                                                    key={user._id}
                                                    className="transition-colors hover:bg-zinc-50/80"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="size-10">
                                                                <AvatarFallback className="bg-zinc-100 text-xs font-semibold text-zinc-700">
                                                                    {getInitials(user.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium text-zinc-900">
                                                                    {user.name}
                                                                    {isCurrentUser && (
                                                                        <span className="ml-2 text-xs font-normal text-zinc-500">
                                                                            You
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <p className="mt-1 text-zinc-500">
                                                                    {user.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <Badge
                                                            variant={
                                                                user.role === "admin" ? "default" : "secondary"
                                                            }
                                                        >
                                                            {user.role === "admin" ? "Admin" : "User"}
                                                        </Badge>
                                                    </td>

                                                    <td className="px-6 py-4 text-zinc-600">
                                                        {formatDate(user.createdAt)}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openEditDialog(user)}
                                                                className="gap-1.5"
                                                            >
                                                                <Pencil className="size-3.5" />
                                                                Edit
                                                            </Button>

                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={isCurrentUser}
                                                                onClick={() => void handleDelete(user)}
                                                                className="gap-1.5 text-red-600 hover:text-red-700"
                                                                title={
                                                                    isCurrentUser
                                                                        ? "You cannot delete your own account"
                                                                        : "Delete user"
                                                                }
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Separator />

                        <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-zinc-500">
                                Page {page} of {totalPages} · {total} total users
                            </p>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1 || loading}
                                    onClick={() => setPage((previous) => previous - 1)}
                                    className="gap-1"
                                >
                                    <ChevronLeft className="size-4" />
                                    Previous
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages || loading}
                                    onClick={() => setPage((previous) => previous + 1)}
                                    className="gap-1"
                                >
                                    Next
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingUser ? "Edit user" : "Create user"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingUser
                                ? "Update this account's details, role, or password."
                                : "Create an account and assign its access role."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="admin-name">Full name</Label>
                            <Input
                                id="admin-name"
                                value={form.name}
                                onChange={(event) => updateForm("name", event.target.value)}
                                placeholder="Enter full name"
                                required
                                autoComplete="name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="admin-email">Email address</Label>
                            <Input
                                id="admin-email"
                                type="email"
                                value={form.email}
                                onChange={(event) => updateForm("email", event.target.value)}
                                placeholder="name@example.com"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="admin-password">
                                Password {editingUser ? "(optional)" : ""}
                            </Label>
                            <Input
                                id="admin-password"
                                type="password"
                                value={form.password}
                                onChange={(event) =>
                                    updateForm("password", event.target.value)
                                }
                                placeholder={
                                    editingUser
                                        ? "Leave blank to keep current password"
                                        : "At least 8 characters"
                                }
                                required={!editingUser}
                                minLength={8}
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="admin-role">Account role</Label>
                            <select
                                id="admin-role"
                                value={form.role}
                                onChange={(event) =>
                                    updateForm("role", event.target.value as Role)
                                }
                                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                            <p className="text-xs text-zinc-500">
                                Admin accounts can access the administration area.
                            </p>
                        </div>

                        {formError && (
                            <p role="alert" className="text-sm text-red-600">
                                {formError}
                            </p>
                        )}

                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeDialog}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting
                                    ? "Saving…"
                                    : editingUser
                                        ? "Save changes"
                                        : "Create user"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </main>
    );
}
