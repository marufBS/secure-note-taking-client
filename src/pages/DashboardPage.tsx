
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    BookOpen,
    Check,
    ChevronLeft,
    ChevronRight,
    FileText,
    LayoutDashboard,
    LogOut,
    Menu,
    MoreHorizontal,
    Plus,
    Search,
    ShieldCheck,
    StickyNote,
    Trash2,
    UserRound,
    X,
    Pencil,
    Eye,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

type Note = {
    _id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt?: string;
};

type AuthUser = {
    id: string;
    name: string;
    email: string;
    role: "user" | "admin";
};

type NotesResponse = {
    notes: Note[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

const PAGE_SIZE = 10;

function formatDate(date: string) {
    return new Date(date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function getInitials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}

export default function DashboardPage() {
    const navigate = useNavigate();
    const token = localStorage.getItem("accessToken");

    const [user, setUser] = useState<AuthUser | null>(() => {
        try {
            return JSON.parse(localStorage.getItem("user") ?? "null");
        } catch {
            return null;
        }
    });

    const [viewingNote, setViewingNote] = useState<Note | null>(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewError, setViewError] = useState("");

    const [notes, setNotes] = useState<Note[]>([]);
    const [totalNotes, setTotalNotes] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadNotes = useCallback(async () => {
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await apiRequest<NotesResponse>(
                `/notes?page=${page}&limit=${PAGE_SIZE}`,
                {},
                token,
            );

            setNotes(result.notes);
            setTotalNotes(result.pagination.total);
            setTotalPages(result.pagination.totalPages);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to load notes";

            setError(message);

            if (/unauthorized|invalid token|expired token/i.test(message)) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                setUser(null);
                navigate("/login", { replace: true });
            }
        } finally {
            setLoading(false);
        }
    }, [navigate, page, token]);

    useEffect(() => {
        void loadNotes();
    }, [loadNotes]);

    function resetForm() {
        setTitle("");
        setContent("");
        setEditingId(null);
    }

    function openCreateDialog() {
        resetForm();
        setError("");
        setSuccess("");
        setDialogOpen(true);
    }

    function openEditDialog(note: Note) {
        setEditingId(note._id);
        setTitle(note.title);
        setContent(note.content);
        setError("");
        setSuccess("");
        setDialogOpen(true);
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

        try {
            if (editingId) {
                await apiRequest<{ note: Note }>(
                    `/notes/${editingId}`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({ title, content }),
                    },
                    token,
                );

                setSuccess("Note updated successfully.");
                resetForm();
                setDialogOpen(false);
                await loadNotes();
            } else {
                await apiRequest<{ note: Note }>(
                    "/notes",
                    {
                        method: "POST",
                        body: JSON.stringify({ title, content }),
                    },
                    token,
                );

                setSuccess("Note created successfully.");
                resetForm();
                setDialogOpen(false);

                if (page !== 1) {
                    setPage(1);
                } else {
                    await loadNotes();
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save note");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(noteId: string) {
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        if (!window.confirm("Are you sure you want to delete this note?")) {
            return;
        }

        setError("");
        setSuccess("");

        try {
            await apiRequest<void>(
                `/notes/${noteId}`,
                { method: "DELETE" },
                token,
            );

            setSuccess("Note deleted successfully.");

            if (editingId === noteId) {
                resetForm();
                setDialogOpen(false);
            }

            if (notes.length === 1 && page > 1) {
                setPage((current) => current - 1);
            } else {
                await loadNotes();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete note");
        }
    }

    function handleLogout() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/login", { replace: true });
    }

    async function handleViewNote(noteId: string) {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            navigate("/login");
            return;
        }

        setViewOpen(true);
        setViewLoading(true);
        setViewError("");
        setViewingNote(null);

        try {
            const note = await apiRequest<Note>(
                `/notes/${noteId}`,
                {},
                token
            );
            

            setViewingNote(note);
        } catch (error) {
            setViewError(
                error instanceof Error
                    ? error.message
                    : "Failed to load note."
            );
        } finally {
            setViewLoading(false);
        }
    }

    const filteredNotes = notes.filter((note) => {
        const query = searchQuery.toLowerCase().trim();

        return (
            !query ||
            note.title.toLowerCase().includes(query) ||
            note.content.toLowerCase().includes(query)
        );
    });

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900">
            <div className="flex min-h-screen">
                {/* Sidebar */}
                <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white lg:flex lg:flex-col">
                    <div className="flex h-[76px] items-center gap-3 px-6">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
                            <ShieldCheck className="size-5" />
                        </div>
                        <div>
                            <p className="font-semibold tracking-tight">Secure Notes</p>
                            <p className="text-xs text-zinc-500">Your private workspace</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="px-4 py-6">
                        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                            Workspace
                        </p>

                        <nav className="space-y-1">
                            <Button
                                variant="secondary"
                                className="h-10 w-full justify-start gap-3 bg-zinc-100 font-medium text-zinc-900 hover:bg-zinc-100"
                            >
                                <StickyNote className="size-4" />
                                My notes
                                <span className="ml-auto rounded-md bg-white px-2 py-0.5 text-xs text-zinc-600">
                                    {totalNotes}
                                </span>
                            </Button>
                            <Button
                                onClick={()=>navigate("/admin/notes")}
                                variant="secondary"
                                className="h-10 w-full justify-start gap-3 bg-zinc-100 font-medium text-zinc-900 hover:bg-zinc-100"
                            >
                                <StickyNote className="size-4" />
                                All notes
                                <span className="ml-auto rounded-md bg-white px-2 py-0.5 text-xs text-zinc-600">
                                    {totalNotes}
                                </span>
                            </Button>

                            <Button
                                variant="ghost"
                                className="h-10 w-full justify-start gap-3 text-zinc-500"
                                disabled
                                title="Coming soon"
                            >
                                <LayoutDashboard className="size-4" />
                                Overview
                            </Button>

                            {user?.role === "admin" && (
                                <Button
                                    variant="ghost"
                                    className="h-10 w-full justify-start gap-3 text-zinc-500"
                                    onClick={() => navigate("/admin")}
                                >
                                    <ShieldCheck className="size-4" />
                                    Admin dashboard
                                </Button>
                            )}
                        </nav>
                    </div>

                    <div className="mt-auto p-4">
                        <Card className="gap-2 border-zinc-200 bg-zinc-50 py-4 shadow-none">
                            <CardContent className="px-4">
                                <div className="mb-2 flex size-9 items-center justify-center rounded-lg border bg-white">
                                    <BookOpen className="size-4 text-zinc-600" />
                                </div>
                                <p className="text-sm font-medium">A space for your thoughts</p>
                                <p className="mt-1 text-xs leading-5 text-zinc-500">
                                    Keep your ideas and notes together in one private place.
                                </p>
                            </CardContent>
                        </Card>

                        <div className="mt-4 flex items-center gap-3 rounded-xl px-2 py-3">
                            <Avatar className="size-9">
                                <AvatarFallback className="bg-zinc-200 text-xs font-semibold text-zinc-700">
                                    {getInitials(user?.name ?? "User")}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {user?.name ?? "User"}
                                </p>
                                <p className="truncate text-xs text-zinc-500">
                                    {user?.email ?? ""}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-zinc-500"
                                onClick={handleLogout}
                                aria-label="Sign out"
                                title="Sign out"
                            >
                                <LogOut className="size-4" />
                            </Button>
                        </div>
                    </div>
                </aside>

                {/* Main workspace */}
                <main className="min-w-0 flex-1">
                    <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur-md sm:px-8">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-900 text-white lg:hidden">
                                <ShieldCheck className="size-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                                        My notes
                                    </h1>
                                    <Badge variant="secondary" className="font-normal">
                                        {totalNotes} total
                                    </Badge>
                                </div>
                                <p className="hidden text-sm text-zinc-500 sm:block">
                                    Capture ideas. Keep them safe.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button onClick={openCreateDialog} className="gap-2">
                                <Plus className="size-4" />
                                <span className="hidden sm:inline">New note</span>
                                <span className="sm:hidden">Create</span>
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger render={
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="size-9"
                                        aria-label="Open account menu"
                                    />
                                }>
                                    <Menu className="size-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={()=>navigate("/profile")}>
                                        <UserRound className="mr-2 size-4" />
                                        {user?.name ?? "Account"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleLogout}>
                                        <LogOut className="mr-2 size-4" />
                                        Sign out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Avatar className="hidden size-9 sm:flex lg:hidden">
                                <AvatarFallback className="bg-zinc-100 text-xs">
                                    {getInitials(user?.name ?? "User")}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </header>

                    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
                        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                            <div>
                                <p className="mb-2 text-sm font-medium text-zinc-500">
                                    YOUR WORKSPACE
                                </p>
                                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                    All your thoughts,
                                    <br className="hidden sm:block" /> in one place.
                                </h2>
                                <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-500 sm:text-base">
                                    A calm space to write down ideas, remember details, and keep
                                    the things that matter.
                                </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                    <FileText className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xl font-semibold leading-tight">
                                        {totalNotes}
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-500">
                                        {totalNotes === 1 ? "Note saved" : "Notes saved"}
                                    </p>
                                </div>
                            </div>
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
                                className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                            >
                                <Check className="size-4" />
                                {success}
                                <button
                                    type="button"
                                    className="ml-auto"
                                    onClick={() => setSuccess("")}
                                    aria-label="Dismiss message"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        )}

                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-lg font-semibold tracking-tight">
                                    Your collection
                                </h3>
                                <p className="mt-1 text-sm text-zinc-500">
                                    Your latest notes, ready when you need them.
                                </p>
                            </div>

                            <div className="relative w-full sm:max-w-xs">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search this page..."
                                    className="h-10 border-zinc-200 bg-white pl-9"
                                    aria-label="Search notes on this page"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <Card key={index} className="gap-4 border-zinc-200 py-5">
                                        <CardHeader className="gap-3 px-5">
                                            <Skeleton className="h-5 w-2/3" />
                                            <Skeleton className="h-3 w-1/3" />
                                        </CardHeader>
                                        <CardContent className="space-y-2 px-5">
                                            <Skeleton className="h-3 w-full" />
                                            <Skeleton className="h-3 w-5/6" />
                                            <Skeleton className="h-3 w-2/3" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : filteredNotes.length === 0 ? (
                            <Card className="border-dashed border-zinc-300 bg-white py-16 shadow-none">
                                <CardContent className="flex flex-col items-center px-6 text-center">
                                    <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-zinc-100">
                                        {searchQuery ? (
                                            <Search className="size-6 text-zinc-500" />
                                        ) : (
                                            <StickyNote className="size-6 text-zinc-500" />
                                        )}
                                    </div>
                                    <h4 className="text-lg font-semibold">
                                        {searchQuery ? "No matching notes" : "Your space is waiting"}
                                    </h4>
                                    <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                                        {searchQuery
                                            ? "Try another search term. Search only checks the notes on this page."
                                            : "You haven't created any notes on this page yet. Start with an idea, a reminder, or anything worth keeping."}
                                    </p>
                                    {!searchQuery && (
                                        <Button onClick={openCreateDialog} className="mt-5 gap-2">
                                            <Plus className="size-4" />
                                            Create your first note
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {filteredNotes.map((note, index) => (
                                    <Card
                                        key={note._id}
                                        className="group gap-0 overflow-hidden border-zinc-200 bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
                                    >
                                        <CardHeader className="gap-3 px-5 pt-5 pb-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <div
                                                        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${index % 3 === 0
                                                            ? "bg-amber-50 text-amber-700"
                                                            : index % 3 === 1
                                                                ? "bg-violet-50 text-violet-700"
                                                                : "bg-emerald-50 text-emerald-700"
                                                            }`}
                                                    >
                                                        <StickyNote className="size-4" />
                                                    </div>
                                                    <CardTitle className="line-clamp-2 text-[15px] leading-6 font-semibold">
                                                        {note.title}
                                                    </CardTitle>
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger render={
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="size-9 "
                                                            aria-label="Open account menu"
                                                        />
                                                    }>
                                                        <MoreHorizontal className="size-4" />
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => handleViewNote(note._id)}
                                                        >
                                                            <Eye className="mr-2 size-4" />
                                                            View note
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openEditDialog(note)}>
                                                            <Pencil className="mr-2 size-4" />
                                                            Edit note
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600"
                                                            onClick={() => void handleDelete(note._id)}
                                                        >
                                                            <Trash2 className="mr-2 size-4" />
                                                            Delete note
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <CardDescription className="text-xs">
                                                Updated{" "}
                                                {formatDate(note.updatedAt ?? note.createdAt)}
                                            </CardDescription>
                                        </CardHeader>

                                        <CardContent className="px-5 pb-5">
                                            <p className="min-h-20 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-600">
                                                {note.content}
                                            </p>

                                            <Separator className="my-4" />

                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-zinc-400">
                                                    Created {formatDate(note.createdAt)}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 gap-1.5 border-zinc-200 text-xs"
                                                    onClick={() => openEditDialog(note)}
                                                >
                                                    <Pencil className="size-3" />
                                                    Edit
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 flex flex-col gap-4 border-t border-zinc-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-zinc-500">
                                Showing {totalNotes === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
                                {"–"}
                                {Math.min(page * PAGE_SIZE, totalNotes)} of {totalNotes} notes
                            </p>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 border-zinc-200 bg-white"
                                    disabled={loading || page <= 1}
                                    onClick={() => setPage((current) => current - 1)}
                                >
                                    <ChevronLeft className="size-4" />
                                    Previous
                                </Button>

                                <span className="min-w-20 text-center text-sm text-zinc-500">
                                    Page {page} of {Math.max(1, totalPages)}
                                </span>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 border-zinc-200 bg-white"
                                    disabled={loading || page >= totalPages || totalPages === 0}
                                    onClick={() => setPage((current) => current + 1)}
                                >
                                    Next
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>

                        <footer className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-zinc-200 pt-5 text-xs text-zinc-400 sm:flex-row">
                            <p>Secure Notes · Your thoughts, kept private.</p>
                            <p className="flex items-center gap-1.5">
                                <ShieldCheck className="size-3.5" />
                                Authenticated workspace
                            </p>
                        </footer>
                    </div>
                </main>
            </div>
            {/* note view dialog */}
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{viewingNote?.title}</DialogTitle>
                        <DialogDescription>
                            {viewingNote?.content}
                        </DialogDescription>
                    </DialogHeader>

                    {viewLoading ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                            Loading note...
                        </div>
                    ) : viewError ? (
                        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                            {viewError}
                        </div>
                    ) : viewingNote ? (
                        <div className="space-y-4">
                            <h3 className="break-words text-lg font-semibold">
                                {viewingNote.title}
                            </h3>

                            <div className="max-h-[50vh] overflow-y-auto rounded-md border p-4">
                                <p className="whitespace-pre-wrap break-words text-sm leading-7">
                                    {viewingNote.content || "No content."}
                                </p>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Created{" "}
                                {new Date(viewingNote.createdAt).toLocaleString()}
                            </p>

                            {viewingNote.updatedAt && (
                                <p className="text-xs text-muted-foreground">
                                    Updated{" "}
                                    {new Date(viewingNote.updatedAt).toLocaleString()}
                                </p>
                            )}
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

            {/* Create / edit note dialog */}
            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open && !saving) resetForm();
                }}
            >
                <DialogContent className="gap-0 p-0 sm:max-w-lg">
                    <DialogHeader className="border-b border-zinc-100 px-6 py-5 text-left">
                        <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-zinc-100">
                            {editingId ? (
                                <Pencil className="size-5 text-zinc-700" />
                            ) : (
                                <Plus className="size-5 text-zinc-700" />
                            )}
                        </div>
                        <DialogTitle className="text-xl">
                            {editingId ? "Edit your note" : "Create a new note"}
                        </DialogTitle>
                        <DialogDescription className="leading-5">
                            {editingId
                                ? "Make changes to your note below."
                                : "Write something you want to remember. You can edit it anytime."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-5 px-6 py-5">
                            <div className="space-y-2">
                                <Label htmlFor="note-title">Title</Label>
                                <Input
                                    id="note-title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Give your note a title"
                                    maxLength={200}
                                    required
                                    autoFocus
                                    className="h-11"
                                />
                                <p className="text-right text-xs text-zinc-400">
                                    {title.length}/200
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="note-content">Content</Label>
                                <Textarea
                                    id="note-content"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Start writing here..."
                                    maxLength={10000}
                                    rows={8}
                                    required
                                    className="min-h-40 resize-y leading-6"
                                />
                                <p className="text-right text-xs text-zinc-400">
                                    {content.length}/10,000
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
                                    resetForm();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving} className="min-w-32 gap-2">
                                {saving ? (
                                    <>
                                        <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="size-4" />
                                        {editingId ? "Save changes" : "Create note"}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
