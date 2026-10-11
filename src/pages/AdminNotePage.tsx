import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    FileText,
    Search,
    ShieldCheck,
    CalendarDays,
} from "lucide-react";

import { apiRequest } from "../lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

type NoteAuthor = {
    _id: string;
    name: string;
    email: string;
};

type AdminNote = {
    _id: string;
    title: string;
    content: string;
    userId: NoteAuthor | null;
    createdAt: string;
    updatedAt?: string;
};

type NotesResponse = {
    notes: AdminNote[];
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

export default function AdminNotesPage() {
    const navigate = useNavigate();
    const token = localStorage.getItem("accessToken");

    const [notes, setNotes] = useState<AdminNote[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadNotes = useCallback(async () => {
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await apiRequest<NotesResponse>(
                `/admin/notes?page=${page}&limit=${PAGE_SIZE}`,
                {},
                token,
            );

            setNotes(result.notes);
            setTotal(result.pagination.total);
            setTotalPages(result.pagination.totalPages);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Failed to load notes.";

            setError(message);

            if (/unauthorized|invalid token|expired token|authentication required/i.test(message)) {
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
        void loadNotes();
    }, [loadNotes]);

    const filteredNotes = notes.filter((note) => {
        const query = search.trim().toLowerCase();

        if (!query) return true;

        return (
            note.title.toLowerCase().includes(query) ||
            note.content.toLowerCase().includes(query) ||
            note.userId?.name.toLowerCase().includes(query) ||
            note.userId?.email.toLowerCase().includes(query)
        );
    });

    return (
        <main className="min-h-screen bg-background">
            <header className="border-b bg-background">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <ShieldCheck className="size-5" />
                        </div>
                        <div>
                            <h1 className="font-semibold tracking-tight">
                                Admin Console
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                All notes
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => navigate("/admin")}
                    >
                        <ArrowLeft className="mr-2 size-4" />
                        Admin dashboard
                    </Button>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
                <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <Badge variant="secondary" className="mb-3">
                            <ShieldCheck className="mr-1 size-3" />
                            Administrator
                        </Badge>
                        <h2 className="text-3xl font-semibold tracking-tight">
                            All notes
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Review notes created by users across the platform.
                        </p>
                    </div>

                    <Card className="shadow-none sm:min-w-44">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                                <FileText className="size-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">
                                    {total}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Total notes
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
                    >
                        {error}
                    </div>
                )}

                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="font-semibold">Note collection</h3>
                        <p className="text-sm text-muted-foreground">
                            Showing {notes.length} notes on this page.
                        </p>
                    </div>

                    <div className="relative w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search notes or authors..."
                            className="pl-9"
                            aria-label="Search notes and authors"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Card key={index}>
                                <CardHeader>
                                    <Skeleton className="h-5 w-2/3" />
                                    <Skeleton className="h-4 w-1/2" />
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : filteredNotes.length === 0 ? (
                    <Card className="border-dashed shadow-none">
                        <CardContent className="flex flex-col items-center py-16 text-center">
                            <FileText className="mb-4 size-10 text-muted-foreground" />
                            <h3 className="font-semibold">
                                {search ? "No matching notes" : "No notes yet"}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {search
                                    ? "Try a different search term."
                                    : "Notes created by users will appear here."}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {filteredNotes.map((note) => (
                            <Card key={note._id} className="overflow-hidden shadow-sm">
                                <CardHeader className="gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                            <FileText className="size-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <CardTitle className="break-words text-base">
                                                {note.title}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {note.userId?.name ?? "Deleted user"}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <p className="break-all text-xs text-muted-foreground">
                                        {note.userId?.email ?? "Author unavailable"}
                                    </p>
                                </CardHeader>

                                <CardContent>
                                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                                        {note.content}
                                    </p>

                                    <Separator className="my-4" />

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <CalendarDays className="size-3.5" />
                                        Created {formatDate(note.createdAt)}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <div className="mt-6 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        {total === 0
                            ? "No notes"
                            : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                                  page * PAGE_SIZE,
                                  total,
                              )} of ${total}`}
                    </p>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={loading || page <= 1}
                            onClick={() => setPage((current) => current - 1)}
                        >
                            Previous
                        </Button>

                        <span className="min-w-20 text-center text-sm text-muted-foreground">
                            Page {page} of {Math.max(1, totalPages)}
                        </span>

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={
                                loading ||
                                totalPages === 0 ||
                                page >= totalPages
                            }
                            onClick={() => setPage((current) => current + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    );
}