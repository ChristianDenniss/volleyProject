/**
 * A thin wrapper around window.fetch that automatically
 * injects your saved bearer token.
 */
export async function authFetch(
    input: RequestInfo,
    init: RequestInit = {},
    token?: string | null
): Promise<Response>
{
    // merge headers (preserve any you passed in)
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (token)
    {
        headers.set("Authorization", `Bearer ${token}`);
    }

    // delegate to fetch
    const response = await fetch(input, { ...init, headers });

    // a 401 on an authenticated call means the token is missing/expired/invalid -
    // clear stale auth state and send the user back to log in
    if (response.status === 401 && token)
    {
        localStorage.removeItem("authToken_v2");
        localStorage.removeItem("currentUser");
        if (window.location.pathname !== "/login")
        {
            window.location.href = "/login";
        }
    }

    return response;
}
    


