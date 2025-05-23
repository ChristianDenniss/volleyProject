/** 
 * A thin wrapper around window.fetch that automatically
 * injects your saved bearer token.
 */
export async function authFetch(
    input: RequestInfo,
    init: RequestInit = {}
): Promise<Response>
{
    // grab your token out of localStorage
    const token = localStorage.getItem("authToken");

    // merge headers (preserve any you passed in)
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (token)
    {
        headers.set("Authorization", `Bearer ${token}`);
    }

    // delegate to fetch
    return fetch(input, { ...init, headers });
}
    


