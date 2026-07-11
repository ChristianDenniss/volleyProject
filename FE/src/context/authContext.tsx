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

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) =>
{
    const [user,    setUser]    = useState<User | null>(null)
    const [token,   setToken]   = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

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
            catch
            {
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
            {children}
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
