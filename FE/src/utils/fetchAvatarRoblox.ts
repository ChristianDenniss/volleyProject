export async function getRobloxAvatarUrl(username: string): Promise<string | null>
{
    try
    {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
        
        // FIXED: Wrapped the URL with backticks
        const url = `${backendUrl}/api/roblox/avatar/${encodeURIComponent(username)}`;
        console.log('Fetching avatar from URL:', url);
        const res = await fetch(url);
        
        if (!res.ok) return null;

        const json = await res.json();
        console.log('Response data:', json);
        return json.avatarUrl || null;
    }
    catch (e)
    {
        console.error("Failed to fetch avatar:", e);
        return null;
    }
}
