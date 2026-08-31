// src/context/AuthContext.tsx

import React
from "react"
import {
    createContext,
    useContext,
    useState,
    useEffect
} from "react"
import type {
    User,
    AuthContextType
} from "../types/interfaces"
import { MOCK_AUTH_TOKEN, mockAuthUser } from "../mocks/data"
import { isMockMode, clearClientAuthState } from "../utils/authStorage"
import { BACKEND_URL } from "../constants/api"
import { classifyServiceError, type ServiceErrorKind } from "../errors/classifyServiceError"
import ServiceErrorPage from "../components/misc/ServiceErrorPage"

const API_BASE = BACKEND_URL

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) =>
{
    const [user,    setUser]    = useState<User | null>(null)
    const [token,   setToken]   = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    /* The profile probe below is the app's first request, so it doubles as a health check: if
       it can't reach the API at all (or the API answers 5xx), nothing else on the site will
       work either and the whole tree is replaced with the branded outage screen.

       Only outages count. A 401 here is the ordinary "not logged in" answer and a 404 is a
       missing record - classifyServiceError returns null for both, and the site renders as
       normal for a signed-out visitor. */
    const [serviceError, setServiceError] = useState<ServiceErrorKind | null>(null)

    useEffect(() =>
    {
        if (isMockMode)
        {
            localStorage.setItem("authToken_v2", MOCK_AUTH_TOKEN)
            localStorage.setItem("currentUser", JSON.stringify(mockAuthUser))
            setToken(MOCK_AUTH_TOKEN)
            setUser(mockAuthUser)
            setLoading(false)
            return
        }

        void (async () =>
        {
            try
            {
                const res = await fetch(`${API_BASE}/api/users/profile`, {
                    credentials: "include",
                })

                if (!res.ok)
                {
                    setServiceError(classifyServiceError(res))
                    clearClientAuthState()
                    setToken(null)
                    setUser(null)
                    return
                }

                const profile = await res.json() as User
                const { password: _password, ...userWithoutPassword } = profile as User & { password?: string }
                localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword))
                setUser(userWithoutPassword)
                setToken(null)
            }
            catch (err)
            {
                // fetch only rejects when the request never reached the server, so this is
                // almost always the "can't reach the API" outage rather than a bad session.
                setServiceError(classifyServiceError(err))
                clearClientAuthState()
                setToken(null)
                setUser(null)
            }
            finally
            {
                setLoading(false)
            }
        })()
    }, [])

    const login = (newUser: User, mockToken?: string) =>
    {
        localStorage.setItem("currentUser", JSON.stringify(newUser))
        setUser(newUser)

        if (isMockMode && mockToken) {
            localStorage.setItem("authToken_v2", mockToken)
            setToken(mockToken)
            return
        }

        setToken(null)
    }

    const logout = () =>
    {
        void fetch(`${API_BASE}/api/users/logout`, {
            method: "POST",
            credentials: "include",
        }).finally(() =>
        {
            clearClientAuthState()
            setToken(null)
            setUser(null)
        })
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                isAuthenticated: !!user,
                loading
            }}
        >
            {serviceError ? <ServiceErrorPage kind={serviceError} fullScreen /> : children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextType
{
    const context = useContext(AuthContext)
    if (!context)
    {
        throw new Error("useAuth must be used within AuthProvider")
    }
    return context
}
