import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FileText,
    Plus,
    MessageSquareText,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    X,
    Check,
    LoaderCircle,
} from "lucide-react";

import { apiRequest } from "../lib/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

type Post = {
    _id: string;
    title: string;
    content: string;
    userId: string;
    createdAt: string;
    updatedAt?: string;
    author?: {
        _id: string;
        name: string;
        email: string;
    }
};

type PostResponse = {
    user: {
        id: string;
        name: string;
    };
    posts: Post[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

type CreatePostResponse = {
    post: Post;
};

type AuthUser = {
    id: string;
    name: string;
    email: string;
    role: "user" | "admin";
};

const PAGE_SIZE = 10;

function formatDate(date: string) {
    return new Date(date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export default function PostsPage() {
    const navigate = useNavigate();

    const token = localStorage.getItem("accessToken");

    const [user] = useState<AuthUser | null>(() => {
        try {
            return JSON.parse(localStorage.getItem("user") ?? "null");
        } catch {
            return null;
        }
    });

    const [posts, setPosts] = useState<Post[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [formOpen, setFormOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadPosts = useCallback(async () => {
        if (!token || !user?.id) {
            navigate("/login", { replace: true });
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await apiRequest<PostResponse>(`/posts?page=${page}&limit=${PAGE_SIZE}`, {}, token,);

            setPosts(result.posts);
            setTotal(result.pagination.total);
            setTotalPages(result.pagination.totalPages);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to load posts";

            setError(message);

            if (
                /authentication required|unauthorized|invalid token|expired token/i.test(
                    message,
                )
            ) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                navigate("/login", { replace: true });
            }
        } finally {
            setLoading(false);
        }
    }, [navigate, page, token, user?.id]);

    useEffect(() => {
        void loadPosts();
    }, [loadPosts]);

    async function handleCreatePost(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            await apiRequest<CreatePostResponse>(
                "/posts",
                {
                    method: "POST",
                    body: JSON.stringify({ title, content }),
                },
                token,
            );

            setTitle("");
            setContent("");
            setFormOpen(false);
            setSuccess("Post published successfully.");

            if (page !== 1) {
                setPage(1);
            } else {
                await loadPosts();
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to publish post",
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="min-h-screen bg-zinc-50 text-zinc-900">
            <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
                            <MessageSquareText className="size-5" />
                        </div>
                        <div>
                            <h1 className="font-semibold tracking-tight">
                                Community Posts
                            </h1>
                            <p className="text-xs text-zinc-500">
                                Share your thoughts
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => navigate("/dashboard")}
                    >
                        Back to notes
                    </Button>
                </div>
            </header>

            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
                <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div>
                        <Badge variant="secondary" className="mb-3">
                            <FileText className="mr-1 size-3" />
                            Posts
                        </Badge>

                        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                            Timeline
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-zinc-500">
                            Publish ideas and revisit what you've shared.
                        </p>
                    </div>

                    <Button
                        onClick={() => {
                            setError("");
                            setSuccess("");
                            setFormOpen((open) => !open);
                        }}
                        className="gap-2"
                    >
                        {formOpen ? (
                            <X className="size-4" />
                        ) : (
                            <Plus className="size-4" />
                        )}
                        {formOpen ? "Cancel" : "Create post"}
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

                {formOpen && (
                    <Card className="mb-8 border-zinc-200 shadow-sm">
                        <CardHeader>
                            <CardTitle>Create a post</CardTitle>
                            <CardDescription>
                                Write something worth sharing.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <form
                                onSubmit={handleCreatePost}
                                className="space-y-5"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="post-title">Title</Label>
                                    <Input
                                        id="post-title"
                                        value={title}
                                        onChange={(event) =>
                                            setTitle(event.target.value)
                                        }
                                        placeholder="Give your post a title"
                                        maxLength={200}
                                        required
                                    />
                                    <p className="text-right text-xs text-zinc-400">
                                        {title.length}/200
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="post-content">
                                        Content
                                    </Label>
                                    <Textarea
                                        id="post-content"
                                        value={content}
                                        onChange={(event) =>
                                            setContent(event.target.value)
                                        }
                                        placeholder="What would you like to share?"
                                        maxLength={10000}
                                        rows={6}
                                        required
                                        className="resize-y leading-6"
                                    />
                                    <p className="text-right text-xs text-zinc-400">
                                        {content.length.toLocaleString()}/10,000
                                    </p>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                Publishing...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="size-4" />
                                                Publish post
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold">Your collection</h3>
                        <p className="mt-1 text-sm text-zinc-500">
                            {total} {total === 1 ? "post" : "posts"} published
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <Card key={index} className="border-zinc-200">
                                <CardHeader className="gap-3">
                                    <Skeleton className="h-5 w-2/3" />
                                    <Skeleton className="h-3 w-1/3" />
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-5/6" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <Card className="border-dashed border-zinc-300 py-16 shadow-none">
                        <CardContent className="flex flex-col items-center text-center">
                            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-zinc-100">
                                <MessageSquareText className="size-6 text-zinc-500" />
                            </div>
                            <h3 className="font-semibold">Nothing published yet</h3>
                            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                                Your posts will appear here after you publish
                                your first one.
                            </p>
                            <Button
                                onClick={() => setFormOpen(true)}
                                className="mt-5 gap-2"
                            >
                                <Plus className="size-4" />
                                Create your first post
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <Card
                                key={post._id}
                                className="border-zinc-200 shadow-sm transition-shadow hover:shadow-md"
                            >
                                <CardHeader>
                                    
                                    
                                    
                                    <div className="flex items-start justify-between gap-4">
                                        <CardTitle className="text-lg leading-7">
                                            {post.title}
                                        </CardTitle>
                                        <Badge variant="outline">Post</Badge>
                                    </div>

                                    <CardDescription className="flex items-center gap-2">
                                        <CalendarDays className="size-3.5" />
                                        Published {formatDate(post.createdAt)}
                                    </CardDescription>
                                    
                                </CardHeader>

                                <CardContent>
                                    <p className="whitespace-pre-wrap break-words text-sm leading-7 text-zinc-700">
                                        {post.content}
                                    </p>

                                    <Separator className="mt-5" />

                                    {/* <p className="mt-3 text-xs text-zinc-400">
                                        {post.updatedAt &&
                                            post.updatedAt !== post.createdAt
                                            ? `Updated ${formatDate(post.updatedAt)}`
                                            : "Original publication"}
                                    </p> */}
                                    <div className="m-3 flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                            {post.author?.name?.charAt(0).toUpperCase() ?? "?"}
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {post.author?.name ?? "Unknown author"}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {post.author?.email ?? "Email unavailable"}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                                
                            </Card>
                        ))}
                    </div>
                )}

                <div className="mt-6 flex flex-col gap-4 border-t border-zinc-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-zinc-500">
                        Page {page} of {Math.max(1, totalPages)}
                    </p>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={loading || page <= 1}
                            onClick={() => setPage((current) => current - 1)}
                            className="gap-1"
                        >
                            <ChevronLeft className="size-4" />
                            Previous
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={
                                loading ||
                                totalPages === 0 ||
                                page >= totalPages
                            }
                            onClick={() => setPage((current) => current + 1)}
                            className="gap-1"
                        >
                            Next
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    );
}