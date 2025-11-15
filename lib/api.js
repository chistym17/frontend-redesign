export const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || "https://176.9.16.194:5403/api";

export async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}
