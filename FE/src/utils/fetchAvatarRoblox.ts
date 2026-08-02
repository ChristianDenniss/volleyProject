import { BACKEND_URL } from "../constants/api";

export async function getRobloxAvatarUrl(username: string): Promise<string | null>
{
    try
    {
        const backendUrl = BACKEND_URL;
        
        const url = `${backendUrl}/api/roblox/avatar/${encodeURIComponent(username)}`;
        const res = await fetch(url);
        
        if (!res.ok) return null;

        const json = await res.json();
        return json.avatarUrl || null;
    }
    catch (e)
    {
        console.error("Failed to fetch avatar:", e);
        return null;
    }
}
