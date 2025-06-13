function getEnvOrFail(str: string): string {
    const value = process.env[str]
    if (!value) throw new Error(`couldn't find ${str} in enviorment`)
    return value
}

export interface OAuth {
    ID: string,
    SECRET: string,
    CALLBACK: string,
    AUTHORIZE_URL: string,
    TOKEN_URL: string,
    SCOPES: string[],
    GET_USER_INFO: string,
}
export const ROBLOX_OAUTH: OAuth = {
    ID: getEnvOrFail("OAUTH_ROBLOX_ID"),
    SECRET: getEnvOrFail("OAUTH_ROBLOX_SECRET"),
    CALLBACK: getEnvOrFail("OAUTH_ROBLOX_CALLBACK"),
    AUTHORIZE_URL: "https://apis.roblox.com/oauth/v1/authorize",
    TOKEN_URL: "https://apis.roblox.com/oauth/v1/authorize",
    GET_USER_INFO: "https://apis.roblox.com/oauth/v1/userinfo", 
    SCOPES: ["profile", "openid"]
}
