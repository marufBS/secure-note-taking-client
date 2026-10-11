
const API_URL = import.meta.env.VITE_API_URL;

export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
    console.log(API_URL)
    const headers = new Headers(options.headers);

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    });

    const data = response.status === 204
        ? null
        : await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(
            data?.message ?? `Request failed: ${response.status}`
        );
    }

    return data as T;
}
